// Require the necessary modules
const { SlashCommandBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const crypto = require('crypto');

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
    .setName('download')
    .setDescription('Download a YouTube video!')
    .addStringOption(option =>
      option
        .setName('link')
        .setDescription('Link to the video you want to download')
        .setRequired(true)),
  async execute(interaction) {
    try {
      const id = crypto.randomBytes(5).toString('hex');
      const link = interaction.options.getString('link'); // Get the link from the user
        await interaction.reply(`Downloading the video! ${id}`)

      // Download the YouTube video with youtube-dl-exec and wrap it in a Promise
      const downloadPromise = new Promise((resolve, reject) => {
        youtubedl(link, {
          restrictFilenames: true,
          output: id + '.%(ext)s',
          noPart: true,
        })
          .then(info => {
            const localFilePath = id + '.mp4';
            resolve(localFilePath); // Resolve the Promise with the local file path
          })
          .catch(error => {
            reject(error); // Reject the Promise if there's an error
          });
      });

      const localFilePath = await downloadPromise; // Wait for the download to finish

      const blobName = id + '.mp4';
      const blockBlobClient = new BlockBlobClient(
        `${baseUrl}/${containerName}/${blobName}`,
        sharedKeyCredential
      );

      await blockBlobClient.uploadFile(localFilePath);

      console.log(`Blob ${blockBlobClient.url} created`);
      return interaction.editReply(`Downloaded the video! Access it at ${baseUrl}/${containerName}/${blobName}`);
    } catch (error) {
      console.error('Error:', error);
      return interaction.editReply('An error occurred while downloading the video.');
    }
  },
};