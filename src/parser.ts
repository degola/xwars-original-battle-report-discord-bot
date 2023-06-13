import axios from "axios";
import { v4 as uuid } from "uuid";
import fs from "node:fs";
import { ObjectMapper } from "json-object-mapper";
import { Data } from "./model/report/Data";

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
    super(message);
    this.name = "ParseError";
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
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
    .find((v) => v.match(new RegExp("^" + identifier + "(.*)$")));
  if (line) return line.substring(identifier.length);
  return false;
};

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
        return stringToReplace;
      return v;
    })
    .join("\n");
}

/** Retrieves the battle report, extracts data, anonymizes the report and saves it.
 *
 * Return values:
 *  - reportId: id of the anonymized report
 *  - data:
 *  - fleetLostData:
 *
 * @param reportUrl - Url of the report from the original.xwars.net server
 * @returns A map containing the report uuid and data from the report.
 */
export async function parseReport(reportUrl: string) {
  if (
    !reportUrl.match(
      /^https:\/\/original.xwars.net\/reports\/(index\.php|)\?id=(.*)/
    )
  )
    throw new ParseError(
      "sorry, the url provided is not a valid battle report url"
    );
  let reportContent = null;
  try {
    reportContent = await axios.get(reportUrl);
  } catch (e) {
    console.log("error while retrieving battle report", e);
    throw new ParseError(
      "sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later."
    );
  }
  if (!reportContent.data) {
    console.log("error while retrieving battle report, empty content");
    throw new ParseError(
      "sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later."
    );
  }

  const jsonData = findLineByIdentifier("JSON:", reportContent.data);
  if (!jsonData)
    throw new ParseError(
      "sorry, unable to parse the battle report, it's too old for this bot :-(."
    );

  const data = ObjectMapper.deserialize(Data, JSON.parse(jsonData));

  let cleanedReportContent = cleanContentByIdentifier(
    ["JSON:", "JSON2:"],
    reportContent.data,
    "json report data reduced for anonymity"
  );
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
    );
  if (data.parties.attacker.planet.name.length > 0) {
    cleanedReportContent = cleanedReportContent.replace(
      new RegExp(escapeRegExp(data.parties.attacker.planet.name), "g"),
      ""
    );
  }
  if (data.parties.defender.planet.name.length > 0) {
    cleanedReportContent = cleanedReportContent.replace(
      new RegExp(escapeRegExp(data.parties.defender.planet.name), "g"),
      ""
    );
  }

  const reportId = uuid() + ".html";
  try {
    fs.writeFileSync(["./reports/", reportId].join(""), cleanedReportContent);
  } catch (e) {
    console.error(e);
  }

  return {
    reportId: reportId,
    data: data,
  };
}
