/**
 * SlashCommand /config definition and execution
 *
 * Usage:
 *   /config default_format <type=user|bot> <format=text|oneline>
 *
 * Sets the default message format for reports parsed by user or bot. <format>
 * is optional. By omitting the format, the current setting will be returned.
 */

import { Command } from "../../command.js"

import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
} from "discord.js"

import { GuildConfigStorage } from "../../guild-config-storage.js"
const config = new GuildConfigStorage()

const builder = new SlashCommandBuilder()
builder
    .setName("config")
    .setDescription("Configure the report parser!")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
        subcommand
            .setName("default_format")
            .setDescription("The default message format.")
            .addStringOption((option) =>
                option
                    .setName("type")
                    .setDescription("message type: user or bot")
                    .setRequired(true)
                    .addChoices(
                        { name: "user", value: "user" },
                        { name: "bot", value: "bot" }
                    )
            )
            .addStringOption((option) =>
                option
                    .setName("format")
                    .setDescription("message format: text or oneline")
                    .addChoices(
                        { name: "text", value: "text" },
                        { name: "oneline", value: "oneline" }
                    )
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("publish_push_reports")
            .setDescription(
                "Sets or gets whether or not the bot should publish push reports"
            )
            .addBooleanOption((option) =>
                option
                    .setName("value")
                    .setDescription(
                        "The value publish_push_reports will be set to"
                    )
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("report_channel")
            .setDescription(
                "Sets or gets the channel reports will be published in"
            )
            .addStringOption((option) =>
                option.setName("id").setDescription("the id of the channel")
            )
    )

const execute = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand()
    const type = interaction.options.get("type")?.value?.toString()
    const format = interaction.options.get("format")?.value?.toString()

    if (!interaction.guild) {
        throw new Error("no guild")
    }

    switch (subcommand) {
        case "default_format":
            if (format) {
                //Set format
                config.setValue(
                    interaction.guild.id,
                    `default_format_${type}`,
                    format
                )

                interaction.reply({
                    content: `Default format for ${type} set to ${format}`,
                    ephemeral: true,
                })
            } else {
                //Return format
                const format =
                    (await config.getValue(
                        interaction.guild.id,
                        `default_format_${type}`
                    )) || "text"

                interaction.reply({
                    content: `Default format for ${type} is ${format}`,
                    ephemeral: true,
                })
            }
            break
        default:
            interaction.reply({
                content: `Unknown subcommand ${subcommand}`,
                ephemeral: true,
            })
    }
}

export const command = new Command(builder, execute)