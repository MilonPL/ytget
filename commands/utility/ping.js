const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check the bot status'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
		await interaction.editReply(`:ping_pong: Pong!\n:stopwatch: Uptime: ${Math.round(interaction.client.uptime / 60000)} minutes\n:round_pushpin: Rountrip Latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
	},
};