require('app-module-path/cwd');

require('dotenv').config()

const DEBUG = process.env.DEBUG || false
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const HTTP_PORT = parseInt(process.env.HTTP_PORT || 3000)
const REPORT_URL_BASE = process.env.REPORT_URL_BASE || 'https://kb.original.xwars.net/'
const REPORT_TOKEN = process.env.REPORT_TOKEN || 'no-token-defined'

if(!DISCORD_BOT_TOKEN) throw new Error('missing required environment variable DISCORD_BOT_TOKEN')

const fs = require('node:fs')
const path = require('node:path')

const express = require('express')
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')

const app = express()

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.commands = new Collection()
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder)
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file)
		const command = require(filePath)
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command)
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
		}
	}
}

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
    if(!interaction.isChatInputCommand()) return

    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
            await interaction.reply({ content: `No command matching ${interaction.commandName} was found.`, ephemeral: true });
        console.error(`No command matching ${interaction.commandName} was found.`)
        return;
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
        }
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
        const {text, embed} = message.createTextMessage(data, fleetLostData, finalReportUrl, '__**X-Wars Original News Agency:**__')
        console.log('x-wars server shared report url', reportUrl, 'as', finalReportUrl)
        client.guilds.cache.each(async guild => { await guild.channels.cache.find(channel => channel.name.match(/battle-reports/)).send({content: text, embeds: embed ? [embed] : null})})
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
