require('dotenv').config()

const DEBUG = process.env.DEBUG || false
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const HTTP_PORT = parseInt(process.env.HTTP_PORT || 3000)
const REPORT_URL_BASE = process.env.REPORT_URL_BASE || 'https://kb.original.xwars.net/'
const REPORT_TOKEN = process.env.REPORT_TOKEN || 'no-token-defined'

if(!DISCORD_BOT_TOKEN) throw new Error('missing required environment variable DISCORD_BOT_TOKEN')

const fs = require('node:fs')
const express = require('express')
const { Client, Events, GatewayIntentBits } = require('discord.js')
const axios = require('axios')
const uuid = require('uuid').v4

const app = express()

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function battleReportDataReducer(accumulator, currentObject) {
    // Iterate over each key in the current object
    for (const key in currentObject) {
        // Check if the key exists in the accumulator object
        if (accumulator.hasOwnProperty(key)) {
            // Add the value to the existing sum for the key
            accumulator[key] += currentObject[key];
        } else {
            // Initialize the sum for the key if it doesn't exist in the accumulator
            accumulator[key] = currentObject[key];
        }
    }

    // Return the updated accumulator
    return accumulator;
}
function calculateMP(att, def) {
    return (att + def) / 200
}
g
async function generateReportText(reportUrl, user, interaction) {
    if (!reportUrl.match(/^https:\/\/original.xwars.net\/reports\/(index\.php|)\?id=(.*)/))
        return interaction && interaction.reply({
            content: 'sorry, the url provided is not a valid battle report url',
            ephemeral: true
        })
    let reportContent = null
    try {
        reportContent = await axios.get(reportUrl)
    } catch (e) {
        console.log('error while retrieving battle report', e)
        return interaction && interaction.reply({
            content: 'sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.',
            ephemeral: true
        })
    }
    if (!reportContent.data) {
        console.log('error while retrieving battle report, empty content', e)
        return interaction && interaction.reply({
            content: 'sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.',
            ephemeral: true
        })
    }

    const jsonData = reportContent.data.match(/JSON:(.*)/)
    if (!jsonData)
        return interaction && interaction.reply({
            content: 'sorry, unable to parse the battle report, it\'s too old for this bot :-(.',
            ephemeral: true
        })
    const parsedJsonData = JSON.parse(jsonData[1])
    const fleetLostData = reportContent.data.match(/JSON2:(.*)/)
    let fleetLostDataParsed = null
    if(fleetLostData) {
        fleetLostDataParsed = JSON.parse(fleetLostData[1])
    }
    let cleanedReportContent = reportContent.data
        .replace(/<!--.*-->/g, '')
        .replace(/JSON:.*/g, 'json report data reduced for anonymity')
        .replace(/JSON2:.*/g, 'json report data reduced for anonymity')
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

    const attacker = Object.values(parsedJsonData.ships.g.att)
        .reduce(battleReportDataReducer, {})
    const attackerMP = calculateMP(attacker.at, attacker.de).toFixed(1)
    const defender = Object.values(parsedJsonData.ships.g.def)
        .reduce(battleReportDataReducer, {})
    const defenderMP = calculateMP(defender.at, defender.de).toFixed(1)
    let resultResponse = ''
    if (parsedJsonData.loot.info.atter_couldloot) {
        if(parsedJsonData.loot.values && Object.values(parsedJsonData.loot.values).some(v => v > 0)) {
            resultResponse = '**Attacker won and looted ' +
                Object.values(parsedJsonData.loot.values)
                    .map((v) => v && v.toLocaleString())
                    .join('/') +
                ' resources! :tada:**'
        } else {
            resultResponse = '**Attacker won :tada: and looted nothing :face_holding_back_tears:!**'
        }
    } else {
        resultResponse = '**Defender won! :tada:**'
    }

    let fleetLostResponse = ''
    if(fleetLostDataParsed) {
        const attackerItems = fleetLostDataParsed.filter(v => v.front === 'att')
        const defenderItems = fleetLostDataParsed.filter(v => v.front === 'def')
        let defenderResponsePart = ''
        if(defenderItems.length === 0) {
            defenderResponsePart = 'Defender was a chicken and didn\'t engage in the fight but also didn\'t lost any units :chicken:.'
        } else {
            const fightValues = defenderItems
                .map(v => v.fight)
                .reduce(battleReportDataReducer, {})
            const survivedItems = defenderItems
                .map(v => v.frest !== '' ? v.frest : {at: 0, de: 0, cn: 0})
                .reduce(battleReportDataReducer, {})
            const fightingMP = calculateMP(fightValues.at, fightValues.de)
            const survivedMP = calculateMP(survivedItems.at, survivedItems.de)
            const survivedMPPercent = (survivedMP / fightingMP * 100).toFixed(1)
            if(defenderItems.filter(v => v.survived === true).length > 0) {
                defenderResponsePart = `Defender lost some units but ${survivedMP.toFixed(1)}mp (${survivedMPPercent}%) survived :face_holding_back_tears:.`
            } else {
                defenderResponsePart = `Defender lost all units (${fightingMP.toFixed(1)}mp) :sob:.`
            }
        }
        let attackerResponsePart = attackerItems
        const fightValues = attackerItems
            .map(v => v.fight)
            .reduce(battleReportDataReducer, {})
        const survivedItems = attackerItems
            .map(v => v.frest !== '' ? v.frest : {at: 0, de: 0, cn: 0})
            .reduce(battleReportDataReducer, {})
        const fightingMP = calculateMP(fightValues.at, fightValues.de)
        const survivedMP = calculateMP(survivedItems.at, survivedItems.de)
        const survivedMPPercent = (survivedMP / fightingMP * 100).toFixed(1)
        if(attackerItems.filter(v => v.survived === true).length > 0) {
            if (survivedMPPercent === '100.0') {
                attackerResponsePart = `Attacker lost nothing :confetti_ball:.`
            } else {
                attackerResponsePart = `Attacker lost some units but ${survivedMP.toFixed(1)}mp (${survivedMPPercent}%) survived :piñata:.`
            }
        } else {
            attackerResponsePart = `Attacker lost all units (${fightingMP.toFixed(1)}mp) :sob:.`
        }

        fleetLostResponse = `
${attackerResponsePart}
${defenderResponsePart}
                `
    }

    const finalReportUrl = [REPORT_URL_BASE, reportId].join('')
    const attackerAlliance = parsedJsonData.parties.attacker.planet.alliance ? '[' + parsedJsonData.parties.attacker.planet.alliance + '] ' : ''
    const defenderAlliance = parsedJsonData.parties.defender.planet.alliance ? '[' + parsedJsonData.parties.defender.planet.alliance + '] ' : ''
    return {
        finalReportUrl: finalReportUrl,
        text: `${user} shared a battle report: ${finalReportUrl}

**Attacker:** ${attackerAlliance}${parsedJsonData.parties.attacker.planet.user_alias} with **${attacker.cn.toLocaleString()}** ships and **${attackerMP}mp** (${attacker.at.toLocaleString()}/${attacker.de.toLocaleString()})
**Defender:** ${defenderAlliance}${parsedJsonData.parties.defender.planet.user_alias} with **${defender.cn.toLocaleString()}** ships/defense units and **${defenderMP}mp** (${defender.at.toLocaleString()}/${defender.de.toLocaleString()})
${fleetLostResponse}
${resultResponse}
${"-".repeat(100)}`
    }
}


client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isCommand()) return

    switch(interaction.commandName) {
        case 'kb':
            const reportUrl = interaction.options.get('url').value
            const pmOnlyOption = interaction.options.get('private')
            let pmOnly = false
            if(pmOnlyOption) {
                if(pmOnlyOption && pmOnlyOption.value === true)
                    pmOnly = true
            }

            const {text, finalReportUrl} = await generateReportText(reportUrl, interaction.user.toString(), interaction)
            // don't send messages to public channel in DEBUG mode
            console.log('shared report url', reportUrl, 'as', finalReportUrl, 'pm-only?', pmOnly)
            if(DEBUG || pmOnly) {
                return interaction.reply({content: text, ephemeral: true })
            }
            await client.channels.cache.find(channel => channel.name.match(/battle-reports/)).send(text)
            await interaction.reply({
                content: `Battle report shared as ${finalReportUrl} in channel ${client.channels.cache.find(channel => channel.name.match(/battle-reports/)).toString()}`,
                ephemeral: true
            })
            break;
        default:
            await interaction.reply({content: 'Unknown command', ephemeral: true })
    }
})

app.get('/report', async (req, res) => {
    if(
        REPORT_TOKEN === 'no-token-defined' ||
        !req.headers.authorization.match(new RegExp("^Bearer " + REPORT_TOKEN + "$"))
    ) {
        res.status(401)
        return res.send({'status': 'access denied, invalid token'})
    }
    const reportUrl = req.query.url
    console.log('received report url via HTTP request', reportUrl)
    try {
        const {text, finalReportUrl} = await generateReportText(reportUrl, '__**X-Wars Original News Agency:**__')
        console.log('x-wars server shared report url', reportUrl, 'as', finalReportUrl)
        await client.channels.cache.find(channel => channel.name.match(/battle-reports/)).send(text)
    } catch(e) {
        console.log('got error while trying to share report via HTTP request', e, reportUrl)
        res.status(500)
        return res.send({'status': 'error while sharing report, check url'})
    }

    res.send()

})

app.use(express.static('reports/'))
/**
 * this endpoint is used by Kubernetes liveness probes and restarts the pod when status is not 200
 */
app.get('/status', (req, res) => {
    if(APP_STATUS === 'ok') {
        res.status(200)
        return res.send({'status': 'ok'})
    }
    res.status(500)
    return res.send({'status': 'error'})
})
app.listen(HTTP_PORT, () => {
    console.log(`Battle report server listening at  port ${HTTP_PORT}`)
})
