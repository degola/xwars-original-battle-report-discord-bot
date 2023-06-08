const axios = require('axios')
const uuid = require('uuid').v4
const fs = require('node:fs')

class ParseError extends Error {
    constructor(message) {
        super(message)
        this.name = "ParseError"
    }
}

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
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
const findLineByIdentifier = (identifier, content) => {
    const line = content
        .split(/\n/)
        .find(
            v => v.match(new RegExp('^' + identifier + '(.*)$'))
        )
    if(line) return line.substring(identifier.length)
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
function cleanContentByIdentifier(identifier, content, stringToReplace) {
    return content
        .split(/\n/)
        .map(v => {
            if(v.match(new RegExp('^[' + identifier.join('|') + '](.*)$')))
                return stringToReplace
            return v
        })
        .join('\n')
}

async function parseReport(reportUrl) {
    if (!reportUrl.match(/^https:\/\/original.xwars.net\/reports\/(index\.php|)\?id=(.*)/))
        throw new ParseError('sorry, the url provided is not a valid battle report url')
    let reportContent = null
    try {
        reportContent = await axios.get(reportUrl)
    } catch (e) {
        console.log('error while retrieving battle report', e)
        throw new ParseError ('sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.')
    }
    if (!reportContent.data) {
        console.log('error while retrieving battle report, empty content', e)
        throw new ParseError('sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.')
    }

    const jsonData = findLineByIdentifier('JSON:', reportContent.data)
    if (!jsonData)
        throw new ParseError('sorry, unable to parse the battle report, it\'s too old for this bot :-(.')
    const parsedJsonData = JSON.parse(jsonData)
    const fleetLostData = findLineByIdentifier('JSON2:', reportContent.data)
    let fleetLostDataParsed = null
    if(fleetLostData) {
        fleetLostDataParsed = JSON.parse(fleetLostData)
    }
    let cleanedReportContent = cleanContentByIdentifier(
        ['JSON:', 'JSON2:'],
        reportContent.data,
        'json report data reduced for anonymity'
    )
    cleanedReportContent = cleanedReportContent
        .replace(/<!--.*-->/g, '')
        .replace(new RegExp([parsedJsonData.parties.attacker.planet.position].join(''), 'g'), 'XxXxX')
        .replace(new RegExp([parsedJsonData.parties.defender.planet.position].join(''), 'g'), 'XxXxX')
    if (parsedJsonData.parties.attacker.planet.name.length > 0) {
        cleanedReportContent = cleanedReportContent
            .replace(new RegExp(escapeRegExp(parsedJsonData.parties.attacker.planet.name), 'g'), '')
    }
    if (parsedJsonData.parties.defender.planet.name.length > 0) {
        cleanedReportContent = cleanedReportContent
            .replace(new RegExp(escapeRegExp(parsedJsonData.parties.defender.planet.name), 'g'), '')
    }

    const reportId = uuid() + '.html'
    try {
        fs.writeFileSync(['./reports/', reportId].join(''), cleanedReportContent)
    } catch (e) {

    }

    return {reportId: reportId, data: parsedJsonData, fleetLostData: fleetLostDataParsed}
}
module.exports.ParseError = ParseError
module.exports.parseReport = parseReport
