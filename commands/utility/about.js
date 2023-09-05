const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Get info about the bot!'),
	async execute(interaction) {
		const embedInfo = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('ytget')
			.addFields(
				{ name: 'About me', value: `ytget is an open-source project dedicated to making YouTube file downloads fast and easy for everyone. With ytget, you can easily extract audio tracks or save your favorite videos right to your device for offline viewing. The maximum supported size is **500MB**, all files are compressed to this size.` },
				{ name: 'Help us keep ytget online', value: `We believe in free access to valuable content, and that's why ytget is available to you at no cost. However, maintaining the cloud infrastructure that powers ytget comes with expenses, including server hosting and bandwidth costs. We rely on the support of our generous users to keep ytget running smoothly and free for all.` },
				{ name: 'We respect your privacy', value: `We do not collect any personal information from our users. We do not request or store any identifiable information, such as names, email addresses, or contact details. Any files uploaded or generated through the Service are automatically deleted after 24 hours. We do not retain or access these files beyond this timeframe.`},
				{ name: 'Donate:', value: `https://github.com/sponsors/MilonPL` },
				{ name: 'GitHub page:', value: `https://github.com/MilonPL/ytget` })
			.setTimestamp()
			.setFooter({ text: 'ytget', iconURL: 'https://i.imgur.com/5iF3zq7.png' });
		await interaction.reply({ embeds: [embedInfo] });
	},
};