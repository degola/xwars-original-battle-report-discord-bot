const { SlashCommandBuilder } = require('discord.js');

const GuildConfigStorage = require('../../guild-config-storage')
const config = new GuildConfigStorage('guild_config.sqlite3')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the report parser!')
    .addSubcommand(subcommand =>
        subcommand
        .setName('default_format')
        .setDescription('The default message format.')
        .addStringOption(option => option.setName('type')
            .setDescription('message type: user or bot')
            .setRequired(true)
            .addChoices({ name: 'user', value: 'user' }, { name: 'bot', value: 'bot' })
        )
        .addStringOption(option => option.setName('format')
            .setDescription('message format: text or oneline')
            .addChoices({ name: 'text', value: 'text' }, { name: 'oneline', value: 'oneline' })
        )
    ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand()
        switch(subcommand) {
            case 'default_format':
                const type = interaction.options.get('type').value
                const format = interaction.options.get('format') ? interaction.options.get('format').value : null

                if(format) {
                    //Set format
                    config.setValue(interaction.guild.id, `default_format_${type}`, format)

                    interaction.reply({content: `Default format for ${type} set to ${format}`, ephemeral: true })
                } else {
                    //Return format
                    const format = await config.getValue(interaction.guild.id, `default_format_${type}`) || 'text'

                    interaction.reply({content: `Default format for ${type} is ${format}`, ephemeral: true })
                }
                break;
            default:
                interaction.reply({content: `Unknown subcommand ${subcommand}`, ephemeral: true })
        }

    }
};
