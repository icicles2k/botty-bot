require('dotenv').config();

const { EmbedBuilder, Collection } = require('discord.js');
const config = require('../config');

async function handleMessage(message, client) {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const ownerPerms = config.owners.includes(message.author.id);

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (!ownerPerms) {
        if (command.staff && !config.staff.includes(message.author.id)) {
            return message.delete();
        }

        if (command.owner && !config.owners.includes(message.author.id)) {
            return message.delete();
        }
    }

    if (!client.cooldowns) {
        client.cooldowns = new Collection();
    }

    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamp = client.cooldowns.get(command.name);
    const cooldown = (command.cooldown) * 1000;

    if (timestamp.has(message.author.id)) {
        const expiration = timestamp.get(message.author.id) + cooldown;

        if (now < expiration) {
            const timeLeft = (expiration - now) / 1000;
            const time = getTime(timeLeft);

            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription(`You may use the ${command.name} again in **${time}**.`)
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 3000);

            return;
        }
    }

    timestamp.set(message.author.id, now);
    setTimeout(() => timestamp.delete(message.author.id), cooldown);

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`An error occurred while running this command: ${error}`);
        const embed = new EmbedBuilder()
        .setColor('#eb4034')
        .setDescription('An error occurred while running this command. You may try again in a few minutes.')
        const msg = await message.channel.send({ embeds: [embed] });
        setTimeout(() => {
            message.delete();
            msg.delete();
        }, 3000);

        return;
    }
};

function getTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    return parts.join(' ');
}

module.exports = { handleMessage };