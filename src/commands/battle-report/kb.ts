/** SlashCommand /kb definition and execution
 *
 * Usage:
 *
 *   /kb <url> <private=True|False> <format=text|oneline>
 *
 * Accepts a battle report url and publishs it anonymised to the #battle-report channel.
 * Optional parameters:
 *  - private: If True, report will not be published but sent as private message
 *  - format: Sets report message format
 */
require('dotenv').config()

const DEBUG = process.env.DEBUG || false
const REPORT_URL_BASE = process.env.REPORT_URL_BASE || 'https://kb.original.xwars.net/'

const parser = require('../../parser.js')
const message = require('../../message.js')

const GuildConfigStorage = require('../../guild-config-storage')
const config = new GuildConfigStorage()

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kb')
        .setDescription('Accepts a battle report url and publishs it anonymised to the #battle-report channel.')
        .setDMPermission(false)
        .addStringOption(
            option => option
            .setName('url')
            .setDescription('battle report url')
            .setRequired(true)
        )
        .addBooleanOption(
            option => option
            .setName('private')
            .setDescription('send the battle report just as private response')
            .setRequired(false)
        )
        .addStringOption(
            option => option
            .setName('format')
            .addChoices({ name: 'text', value: 'text' }, { name: 'oneline', value: 'oneline' })
            .setDescription('message format options: text, oneline')
            .setRequired(false)
        ),
    async execute(interaction) {
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
            let msgFunction
            switch(interaction.options.get('format') != null ? interaction.options.get('format').value : await config.getValue(interaction.guild.id, 'default_format_user')) {
                case 'oneline':
                    msgFunction = message.createOneLineMessage
                    break
                case 'text':
                default:
                    msgFunction = message.createTextMessage
                    break
            }
            const {text, embed} = msgFunction(data, fleetLostData, finalReportUrl, interaction.user.toString())

            console.log('shared report url', reportUrl, 'as', finalReportUrl, 'pm-only?', pmOnly)
            if(DEBUG || pmOnly) {
                return interaction.reply({content: text, embeds: embed ? [embed] : null, ephemeral: true })
            }
            await interaction.guild.channels.cache
                .find(channel => channel.name.match(/battle-reports/)).send({content: text, embeds: embed ? [embed] : null})
            await interaction.reply({
                content: `Battle report shared as ${finalReportUrl} in channel ${interaction.guild.channels.cache.find(channel => channel.name.match(/battle-reports/)).toString()}`,
                ephemeral: true
            })
        } catch(e) {
            if(e instanceof parser.ParseError) {
                return interaction && interaction.reply({
                    content: e.message,
                    ephemeral: true
                })
            } else {
                throw e
            }
        }

    },
};
