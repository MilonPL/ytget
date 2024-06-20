const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const youtubedl = require('youtube-dl-exec');
const crypto = require('node:crypto');
const fs = require('node:fs');
const ffmpeg = require('fluent-ffmpeg');
const {
    StorageSharedKeyCredential,
    BlockBlobClient,
} = require("@azure/storage-blob");
require('dotenv').config();

const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const url = process.env.URL;
if (!storageAccountName) throw Error("Azure Storage Account Name not found");
if (!storageAccountKey) throw Error("Azure Storage Account Key not found");
if (!url) throw Error("Azure URL not found");

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/ffmpeg/bin/ffprobe.exe");

const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
const baseUrl = `https://${storageAccountName}.blob.core.windows.net`;
const containerName = `downloaded`;

const downloadVideo = async (link, format, id) => {
    const options = {
        restrictFilenames: true,
        output: `${id}.%(ext)s`,
        noPart: true,
        noPlaylist: true,
        maxFilesize: '500M',
        ignoreErrors: true,
        format: format === 'mp3' ? 'm4a' : format,
    };
    await youtubedl(link, options);
    if (format === 'mp3') {
        await new Promise((resolve, reject) => {
            ffmpeg(`${id}.m4a`)
                .toFormat("mp3")
                .save(`${id}.mp3`)
                .on('end', () => {
                    fs.unlinkSync(`${id}.m4a`);
                    resolve();
                })
                .on('error', reject);
        });
    }
};

const uploadToAzure = async (filePath, blobName) => {
    const blockBlobClient = new BlockBlobClient(`${baseUrl}/${containerName}/${blobName}`, sharedKeyCredential);
    await blockBlobClient.uploadFile(filePath);
    fs.unlinkSync(filePath);
    return blockBlobClient.url;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get')
        .setDescription('Download a YouTube video!')
        .addStringOption(option => option.setName('link').setDescription('Link to the video you want to download').setRequired(true))
        .addStringOption(option => option.setName('format').setDescription('Select the file format').setRequired(true).addChoices(
            { name: 'mp4', value: 'mp4' },
            { name: 'm4a', value: 'm4a' },
            { name: '3gp', value: '3gp' },
            { name: 'webm', value: 'webm' },
            { name: 'mp3', value: 'mp3' }
        )),
    async execute(interaction) {
        const id = crypto.randomBytes(5).toString('hex');
        const link = interaction.options.getString('link');
        const format = interaction.options.getString('format');
        const embedDownloading = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(':computer: Downloading the video!')
            .setDescription(':hourglass_flowing_sand: Please wait...')
            .addFields(
                { name: ':bulb: Link:', value: `${link}` },
                { name: ':movie_camera: File format:', value: `${format}` }
            )
            .setTimestamp()
            .setFooter({ text: 'This can take a while, depending on the video size.' });

        await interaction.reply({ embeds: [embedDownloading] });

        try {
            await downloadVideo(link, format, id);
            const blobName = `${id}.${format}`;
            await uploadToAzure(`${id}.${format}`, blobName);

            const embedDownloaded = new EmbedBuilder()
                .setColor(0x37D600)
                .setTitle(':white_check_mark: Successfully downloaded the video!')
                .setDescription(`You can access it at https://${url}/${containerName}/${blobName}`)
                .setTimestamp()
                .setFooter({ text: 'Thank you for using ytget!' });

            await interaction.editReply({ embeds: [embedDownloaded] });
        } catch (error) {
            console.error('Error:', error);
            const embedError = new EmbedBuilder()
                .setColor(0xFF1F00)
                .setTitle(':x: An error occurred while downloading the video.');
            await interaction.editReply({ embeds: [embedError] });
        }
    },
};
