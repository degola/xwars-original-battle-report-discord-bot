import "reflect-metadata"

import "dotenv/config"

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "3000")
const REPORT_URL_BASE =
    process.env.REPORT_URL_BASE || "https://kb.original.xwars.net/"
const REPORT_TOKEN = process.env.REPORT_TOKEN || "no-token-defined"

if (!DISCORD_BOT_TOKEN)
    throw new Error("missing required environment variable DISCORD_BOT_TOKEN")

import path from "node:path"

import express from "express"
import {
    Awaitable,
    Client,
    Events,
    GatewayIntentBits,
    CloseEvent,
    TextChannel,
} from "discord.js"

import { CommandManager } from "./command"
import * as parser from "./parser"
import * as message from "./message"
import { GuildConfigStorage } from "./guild-config-storage"

;(async function () {
    const app = express()

    const config = new GuildConfigStorage()

    // Create a new client instance
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })

    const commands = await CommandManager.loadFolder(
        path.join(__dirname, "commands")
    )

    // When the client is ready, run this code (only once)
    client.once(Events.ClientReady, (c) => {
        console.log(`Bot is ready! Logged in to Discord as ${c.user.tag}`)
    })

    let APP_STATUS = "ok"
    function discordErrorHandler(error: Error): Awaitable<void> {
        console.error("discord error", error)
        APP_STATUS = "error"
    }
    function discordDisconnectHandler(
        error: CloseEvent,
        id: number
    ): Awaitable<void> {
        console.error("discord error", error, id)
        APP_STATUS = "error"
    }

    client.on(Events.Error, discordErrorHandler)
    client.on(Events.ShardError, discordErrorHandler)
    client.on(Events.ShardDisconnect, discordDisconnectHandler)

    // Log in to Discord with your client's token
    client.login(DISCORD_BOT_TOKEN)

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return

        const command = commands.get(interaction.commandName)

        if (!command) {
            await interaction.reply({
                content: `No command matching ${interaction.commandName} was found.`,
                ephemeral: true,
            })
            console.error(
                `No command matching ${interaction.commandName} was found.`
            )
            return
        }

        try {
            await command.execute(interaction)
        } catch (error) {
            console.error(error)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                })
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                })
            }
        }
    })

    app.get("/report", async (req, res) => {
        if (
            REPORT_TOKEN === "no-token-defined" ||
            !(
                req.headers.authorization &&
                req.headers.authorization.match(
                    new RegExp("^Bearer " + REPORT_TOKEN + "$")
                )
            )
        ) {
            res.status(401)
            return res.send({ status: "access denied, invalid token" })
        }

        const reportUrl = req.query.url
        try {
            if (reportUrl == undefined) throw new Error("no report url")
            if (typeof reportUrl != "string")
                throw new Error("report url isnt string")
            console.log("received report url via HTTP request", reportUrl)
            const { reportId, data, fleetData } = await parser.parseReport(
                reportUrl
            )
            const finalReportUrl = [REPORT_URL_BASE, reportId].join("")
            console.log(
                "x-wars server shared report url",
                reportUrl,
                "as",
                finalReportUrl
            )
            const msgText = message.createMessage(
                "text",
                data,
                fleetData,
                finalReportUrl,
                "__**X-Wars Original News Agency:**__"
            )

            const msgOneLine = message.createMessage(
                "oneline",
                data,
                fleetData,
                finalReportUrl,
                "__**X-Wars Original News Agency:**__"
            )
            client.guilds.cache.each(async (guild) => {
                let text, embed
                switch (
                    (await config.getValue(guild.id, "default_format_bot")) ||
                    "text"
                ) {
                    case "oneline":
                        text = msgOneLine.text
                        embed = msgOneLine.embed
                        break
                    case "text":
                    default:
                        text = msgText.text
                        embed = msgText.embed
                        break
                }
                const cache = guild.channels.cache
                if (cache == undefined) {
                    throw Error("no channels found")
                }
                const channel = cache.find((channel) =>
                    channel.name.match(/battle-reports/)
                )
                if (channel == undefined) {
                    throw new Error("batte reports channel not found")
                }
                if (channel instanceof TextChannel) {
                    await channel.send({
                        content: text,
                        embeds: embed ? [embed] : undefined,
                    })
                }
            })
        } catch (e) {
            console.log(
                "got error while trying to share report via HTTP request",
                e,
                reportUrl
            )
            res.status(500)
            return res.send({ status: "error while sharing report, check url" })
        }

        res.send()
    })

    app.use(express.static("reports/"))
    /**
     * this endpoint is used by Kubernetes liveness probes and restarts the pod when status is not 200
     */
    app.get("/status", (req, res) => {
        if (APP_STATUS === "ok") {
            res.status(200)
            return res.send({ status: "ok" })
        }
        res.status(500)
        return res.send({ status: "error" })
    })
    app.listen(HTTP_PORT, () => {
        console.log(`Battle report server listening at  port ${HTTP_PORT}`)
    })
})()
