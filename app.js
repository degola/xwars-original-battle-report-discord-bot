require('dotenv').config()

const DEBUG = process.env.DEBUG || false
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const HTTP_PORT = parseInt(process.env.HTTP_PORT || 3000)
const REPORT_URL_BASE = process.env.REPORT_URL_BASE || 'https://kb.original.xwars.net/'
const REPORT_TOKEN = process.env.REPORT_TOKEN || 'no-token-defined'

if(!DISCORD_BOT_TOKEN) throw new Error('missing required environment variable DISCORD_BOT_TOKEN')

const express = require('express')
const { Client, Events, GatewayIntentBits } = require('discord.js')

const app = express()

const parser = require('./parser.js')
const message = require('./message.js')

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
            const pmOnlyOption = interaction.options.get('private')
            let pmOnly = false
            if(pmOnlyOption) {
                if(pmOnlyOption && pmOnlyOption.value === true)
                    pmOnly = true
            }

            try {
                const {reportId, data, fleetLostData} = await parser.parseReport(reportUrl)
                const finalReportUrl = [REPORT_URL_BASE, reportId].join('')
                const {text} = message.createTextMessage(data, fleetLostData, finalReportUrl, interaction.user.toString())

                console.log('shared report url', reportUrl, 'as', finalReportUrl, 'pm-only?', pmOnly)
                if(DEBUG || pmOnly) {
                    return interaction.reply({content: text, ephemeral: true })
                }
                await interaction.guild.channels.cache.find(channel => channel.name.match(/battle-reports/)).send(text)
                await interaction.reply({
                    content: `Battle report shared as ${finalReportUrl} in channel ${client.channels.cache.find(channel => channel.name.match(/battle-reports/)).toString()}`,
                    ephemeral: true
                })
            } catch(e) {
                if(typeof e != 'ParseError')
                    throw e
                else
                    return interaction && interaction.reply({
                        content: e.message,
                        ephemeral: true
                    })
            }
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
        const {reportId, data, fleetLostData} = await parser.parseReport(reportUrl)
        const finalReportUrl = [REPORT_URL_BASE, reportId].join('')
        const {text} = message.createTextMessage(data, fleetLostData, finalReportUrl, '__**X-Wars Original News Agency:**__')
        console.log('x-wars server shared report url', reportUrl, 'as', finalReportUrl)
        client.guilds.cache.each(async guild => { await guild.channels.cache.find(channel => channel.name.match(/battle-reports/)).send(text)})
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
