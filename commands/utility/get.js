// Require the necessary modules
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const crypto = require('node:crypto');
const fs = require('node:fs');

// Azure Storage dependency
const {
	StorageSharedKeyCredential,
	BlockBlobClient,
} = require("@azure/storage-blob");

// Load variables from dotenv
require('dotenv').config()
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
if (!storageAccountName) throw Error("Azure Storage Account Name not found");
if (!storageAccountKey) throw Error("Azure Storage Account Key not found");

// Create credential
const sharedKeyCredential = new StorageSharedKeyCredential(
	storageAccountName,
	storageAccountKey
);

// Blob data
const baseUrl = `https://${storageAccountName}.blob.core.windows.net`;
const containerName = `downloaded`;

// Main command
module.exports = {
	data: new SlashCommandBuilder()
		.setName('get')
		.setDescription('Download a YouTube video!')
		.addStringOption(option =>
			option
				.setName('link')
				.setDescription('Link to the video you want to download')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('format')
				.setDescription('Select the file format')
				.setRequired(true)
				.addChoices(
					{ name: 'mp4', value: 'mp4' },
					{ name: 'm4a', value: 'm4a' },
					{ name: '3gp', value: '3gp' },
					{ name: 'webm', value: 'webm' }
				)
		),
	async execute(interaction) {
		try {
			const id = crypto.randomBytes(5).toString('hex');
			const link = interaction.options.getString('link'); // Get the link from the user
			const format = interaction.options.getString('format');
			// Downloading embed here
			const embedDownloading = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(':computer: Downloading the video!')
				.setDescription(':hourglass_flowing_sand: Please wait...')
				.addFields(
					{ name: ':bulb: Link:', value: `${link}` },
					{ name: ':movie_camera: File format:', value: `${format}` }
			)
				.setTimestamp()
				.setFooter({ text: 'This can take several minutes, depending on the video size.' })
			await interaction.reply({ embeds: [embedDownloading] });

			// Download the YouTube video with youtube-dl-exec and wrap it in a Promise
			const downloadPromise = new Promise((resolve, reject) => {
				youtubedl(link, {
					restrictFilenames: true,
					output: id + '.%(ext)s',
					noPart: true,
					noPlaylist: true,
					maxFilesize: '500MB',
					ignoreErrors: true,
					format: format
				})
					.then(info => {
						const localFilePath = `${id}.${format}`;
						resolve(localFilePath); // Resolve the Promise with the local file path
					})
					.catch(error => {
						reject(error); // Reject the Promise if there's an error
					});
			});
			const localFilePath = await downloadPromise; // Wait for the download to finish
			const blobName = `${id}.${format}`;
			const blockBlobClient = new BlockBlobClient( // Create the blob
			`${baseUrl}/${containerName}/${blobName}`,
			 sharedKeyCredential
			);
			await blockBlobClient.uploadFile(localFilePath); // Send data to blob
			console.log(`Blob ${blockBlobClient.url} created`);
			fs.unlinkSync(`${id}.${format}`)
			// Success embed here
			const embedDownloaded = new EmbedBuilder()
				.setColor(0x37D600)
				.setTitle(':white_check_mark: Successfully downloaded the video!')
				.setDescription(`You can access it at https://ytget.ogdg.pl/${containerName}/${blobName}`)
				.setTimestamp()
				.setFooter({ text: 'Thank you for using ytget!' })
			return interaction.editReply({ embeds: [embedDownloaded] }); // Update the reply
		} catch (error) {
			console.error('Error:', error);
			// Error embed here
			const embedError = new EmbedBuilder()
				.setColor(0xFF1F00)
				.setTitle(':x: An error occurred while downloading the video.')
			return interaction.editReply({ embeds: [embedError] });
		}
	},
};