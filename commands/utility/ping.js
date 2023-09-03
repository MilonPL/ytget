const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check the bot status'),
	async execute(interaction) {
		const embedPinging = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Pinging...')
		const sent = await interaction.reply({ embeds: [embedPinging], fetchReply: true });
		const embedPinged = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(':ping_pong: Pong!')
			.addFields(
				{ name: ':stopwatch: Uptime:', value: `${Math.round(interaction.client.uptime / 60000)} minutes` },
				{ name: ':round_pushpin: Latency:', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`})
			.setTimestamp()
			.setFooter({ text: 'ytget', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
		await interaction.editReply({ embeds: [embedPinged] });
	},
};