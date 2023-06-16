import "reflect-metadata"

import "dotenv/config"

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_BOT_CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID

if (!DISCORD_BOT_TOKEN || !DISCORD_BOT_CLIENT_ID)
    throw new Error(
        "missing required environment variables DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID"
    )

import { REST, Routes } from "discord.js"
import path from "node:path"
import { CommandManager } from "./command.js"

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_BOT_TOKEN)

// and deploy your commands!
;(async () => {
    try {
        const commands = []
        const manager = await CommandManager.loadFolder(
            path.join(__dirname, "commands")
        )

        for (const command of manager) {
            commands.push(command.data.toJSON())
        }
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`
        )

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(DISCORD_BOT_CLIENT_ID),
            { body: commands }
        )

        if (data instanceof Array) {
            console.log(
                `Successfully reloaded ${data.length} application (/) commands.`
            )
        }
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error)
    }
})()
