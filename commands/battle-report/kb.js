const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kb')
        .setDescription('Accepts a battle report url and publishs it anonymised to the #battle-report channel.')
        .addStringOption(
            option => option
                .setName('url')
                .setDescription('battle report url')
                .setRequired(true)
        )
    ,
    async execute(interaction) {
        await interaction.reply('KB!');
    },
};
