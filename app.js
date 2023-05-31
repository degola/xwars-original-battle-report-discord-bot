require('dotenv').config()

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const HTTP_PORT = parseInt(process.env.HTTP_PORT || 3000)
const REPORT_URL_BASE = process.env.REPORT_URL_BASE || 'https://kb.original.xwars.net/'

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

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
    console.log(`Bot is ready! Logged in to Discord as ${c.user.tag}`)
});

let APP_STATUS = 'ok'
function discordErrorHandler(error) {
    console.error('discord error', error)
    APP_STATUS = 'error'
}
client.on(Events.Error, discordErrorHandler);
client.on(Events.ShardError, discordErrorHandler);
client.on(Events.ShardDisconnect, discordErrorHandler);

// Log in to Discord with your client's token
client.login(DISCORD_BOT_TOKEN);


client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isCommand()) return

    switch(interaction.commandName) {
        case 'kb':
            const reportUrl = interaction.options.get('url').value
            if (!reportUrl.match(/^https:\/\/original.xwars.net\/reports\/(index\.php|)\?id=(.*)/))
                return interaction.reply({
                    content: 'sorry, the url provided is not a valid battle report url',
                    ephemeral: true
                })
            let reportContent = null
            try {
                reportContent = await axios.get(reportUrl)
            } catch (e) {
                console.log('error while retrieving battle report', e)
                return interaction.reply({
                    content: 'sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.',
                    ephemeral: true
                })
            }
            if (!reportContent.data) {
                console.log('error while retrieving battle report, empty content', e)
                return interaction.reply({
                    content: 'sorry, unable to retrieve the battle report, either the url is incorrect or unable to fetch the battle report temporarily, please try again later.',
                    ephemeral: true
                })
            }

            const jsonData = reportContent.data.match(/JSON:(.*)/)
            if (!jsonData)
                return interaction.reply({
                    content: 'sorry, unable to parse the battle report, it\'s too old for this bot :-(.',
                    ephemeral: true
                })
            const parsedJsonData = JSON.parse(jsonData[1])

            let cleanedReportContent = reportContent.data
                .replace(/<!--.*-->/g, '')
                .replace(/JSON:.*/g, 'json report data reduced for anonymity')
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
            const defender = Object.values(parsedJsonData.ships.g.def)
                .reduce(battleReportDataReducer, {})
            let resultResponse = ''
            if (parsedJsonData.loot.info.atter_couldloot) {
                resultResponse = '**Attacker won and looted ' +
                    Object.values(parsedJsonData.loot.values)
                        .map((v) => v.toLocaleString())
                        .join('/') +
                    ' resources! :tada:**'
            } else {
                resultResponse = '**Defender won! :tada:**'
            }

            const finalReportUrl = [REPORT_URL_BASE, reportId].join('')
            const attackerAlliance = parsedJsonData.parties.attacker.planet.alliance ? '[' + parsedJsonData.parties.attacker.planet.alliance + '] ' : ''
            const defenderAlliance = parsedJsonData.parties.defender.planet.alliance ? '[' + parsedJsonData.parties.defender.planet.alliance + '] ' : ''
            const text = `${interaction.user.toString()} shared a battle report: ${finalReportUrl}

**Attacker:** ${attackerAlliance}${parsedJsonData.parties.attacker.planet.user_alias} with **${attacker.cn.toLocaleString()}** ships (${attacker.at.toLocaleString()}/${attacker.de.toLocaleString()})
**Defender:** ${defenderAlliance}${parsedJsonData.parties.defender.planet.user_alias} with **${defender.cn.toLocaleString()}** ships/defense units (${defender.at.toLocaleString()}/${defender.de.toLocaleString()})

${resultResponse}`

            await client.channels.cache.find(channel => channel.name.match(/battle-reports/)).send(text)
            console.log('shared report url', reportUrl, 'as', finalReportUrl)
            await interaction.reply({
                content: `Battle report shared as ${finalReportUrl} in channel ${client.channels.cache.find(channel => channel.name.match(/battle-reports/)).toString()}`,
                ephemeral: true
            })
            break;
        default:
            await interaction.reply({content: 'Unknown command', ephemeral: true })
    }
})

app.use(express.static('reports/'))
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
