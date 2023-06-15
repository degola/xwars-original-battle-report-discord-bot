import axios from "axios"
import { v4 as uuid } from "uuid"
import fs from "node:fs"
import { ObjectMapper } from "json-object-mapper"
import { Data } from "./model/report/Data"
import { Fleet } from "./model/report/Fleet"
import { validateData, validateFleetData } from "./validator"

/**
 * The parser will throw this error if the report can't be parsed
 */
export class ParseError extends Error {
    /**
     * Default contructor
     *
     * @param message - Error message
     */
    constructor(message: string) {
        super(message)
        this.name = "ParseError"
    }
}

function escapeRegExp(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

/**
 * identify a single line with a prefix identifier to extract everything following in that line to get battle report meta data
 * this is necessary since users started to use JSON:/JSON2: in their user aliases and planet names which broke a
 * more relaxed/easier implementation
 *
 * @param identifier
 * @param content
 * @return {boolean|string}
 */
const findLineByIdentifier = (identifier: string, content: string) => {
    const line = content
        .split(/\n/)
        .find((v) => v.match(new RegExp("^" + identifier + "(.*)$")))
    if (line) return line.substring(identifier.length)
    return false
}

/**
 * identify and remove a single line with a prefix identifier to extract everything following in that line to get battle report meta data
 * this more complex implementation is necessary since users started to use JSON:/JSON2: in their user aliases and planet names which broke a
 * more relaxed/easier implementation
 *
 * @param identifier
 * @param content
 * @return {boolean|string}
 */
function cleanContentByIdentifier(
    identifier: Array<string>,
    content: string,
    stringToReplace: string
) {
    return content
        .split(/\n/)
        .map((v) => {
            if (v.match(new RegExp("^[" + identifier.join("|") + "](.*)$")))
                return stringToReplace
            return v
        })
        .join("\n")
}

/** Extracts data from report, anonymizes the report and saves it.
 *
 * Return values:
 *  - reportId: id of the anonymized report
 *  - data:
 *  - fleetLostData:
 *
 * @param reportContent - content of the battle report
 * @returns A map containing the report uuid and data from the report.
 */
export function parseReport(reportContent: string) {
    const jsonData = findLineByIdentifier("JSON:", reportContent)
    if (!jsonData)
        throw new ParseError(
            "sorry, unable to parse the battle report, it's too old for this bot :-(."
        )

    const rawData = JSON.parse(jsonData)

    /*
     * If the attacker|defender has only surviving
     *  - drones + light
     *  - drones + light + medium
     *  - drones + light + medium + heavy
     * the property ships.result.att|ships.result.def will be an array instead of an
     * object. This needs to be corrected before validation
     */
    if (rawData && rawData.ships && rawData.ships.result) {
        if (
            rawData.ships.result.def &&
            rawData.ships.result.def instanceof Array
        ) {
            const oldDef = rawData.ships.result.def
            const newDef: { [k: string]: any } = {}
            for (let i = 1; i < oldDef.length; i++)
                newDef[i.toString()] = oldDef[i]
            rawData.ships.result.def = newDef
        }
        if (
            rawData.ships.result.att &&
            rawData.ships.result.att instanceof Array
        ) {
            const oldAtt = rawData.ships.result.def
            const newAtt: { [k: string]: any } = {}
            for (let i = 1; i < oldAtt.length; i++)
                newAtt[i.toString()] = oldAtt[i]
            rawData.ships.result.def = newAtt
        }
    }

    const valid = validateData(rawData)

    if (!valid) {
        console.log("data: JSON validation error\n", validateData.errors)
        throw new Error("JSON validation error")
    }
    const data = ObjectMapper.deserialize(Data, rawData)

    let fleetData: Fleet[] = []
    const jsonFleetData = findLineByIdentifier("JSON2:", reportContent)
    if (jsonFleetData) {
        const rawFleetData: Array<any> = JSON.parse(jsonFleetData)

        /*
         * If a fleet is destroyed completely the property frest is an empty string instead
         * of null. I couldn't figure out how to correct this inside the json schema so the
         * empty string needs to be replaced before validation.
         */
        for (const fleet of rawFleetData) {
            if (fleet.frest == "") fleet.frest = { at: 0, de: 0, cn: 0 }
        }

        if (!validateFleetData(rawFleetData)) {
            console.log(
                "fleetData: JSON validation error\n",
                validateFleetData.errors
            )
            throw new Error("JSON validation error")
        }
        fleetData = ObjectMapper.deserializeArray(Fleet, rawFleetData)
    }

    let cleanedReportContent = cleanContentByIdentifier(
        ["JSON:", "JSON2:"],
        reportContent,
        "json report data reduced for anonymity"
    )
    cleanedReportContent = cleanedReportContent
        .replace(/<!--.*-->/g, "")
        .replace(
            new RegExp(
                [data.parties.attacker.planet.position.toString()].join(""),
                "g"
            ),
            "XxXxX"
        )
        .replace(
            new RegExp(
                [data.parties.defender.planet.position.toString()].join(""),
                "g"
            ),
            "XxXxX"
        )
    if (data.parties.attacker.planet.name.length > 0) {
        cleanedReportContent = cleanedReportContent.replace(
            new RegExp(escapeRegExp(data.parties.attacker.planet.name), "g"),
            ""
        )
    }
    if (data.parties.defender.planet.name.length > 0) {
        cleanedReportContent = cleanedReportContent.replace(
            new RegExp(escapeRegExp(data.parties.defender.planet.name), "g"),
            ""
        )
    }

    const reportId = uuid() + ".html"
    try {
        fs.writeFileSync(
            ["./reports/", reportId].join(""),
            cleanedReportContent
        )
    } catch (e) {
        console.error(e)
    }

    return {
        reportId: reportId,
        data: data,
        fleetData: fleetData,
    }
}

/**
 * Retrieves the report from a url and return the content
 * @param reportUrl url of the report
 * @returns content of the report
 */
export async function fetchUrl(reportUrl: string): Promise<string> {
    if (
        !reportUrl.match(
            /^https:\/\/original.xwars.net\/reports\/(index\.php|)\?id=(.*)/
        )
    )
        throw new ParseError(
            "sorry, the url provided is not a valid battle report url"
        )
    let response = null
    try {
        response = await axios.get(reportUrl)
    } catch (e) {
        console.log("error while retrieving battle report", e)
        throw new ParseError(
            "sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later."
        )
    }
    if (!response.data) {
        console.log("error while retrieving battle report, empty content")
        throw new ParseError(
            "sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later."
        )
    }
    if (typeof response.data != "string") {
        console.log("error content data is no string")

        throw new ParseError(
            "sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later."
        )
    }

    return response.data
}
