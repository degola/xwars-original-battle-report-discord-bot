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
        .addBooleanOption(
            option => option
                .setName('pm')
                .setDescription('send the battle report just as private response')
                .setRequired(false)
        )
    ,
    async execute(interaction) {
        await interaction.reply('KB!');
    },
};
