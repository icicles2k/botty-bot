const { EmbedBuilder } = require('discord.js');
const Infraction = require('../schemas/automod-infraction');
const filteredWords = require('../settings/filtered-words');
const severeWords = require('../settings/severe-words');
const config = require('../config');

const { generateID } = require('../functions/generate-infraction-ids');
const { formatDates } = require('../functions/expiry-dates');
const { deleteExpiredAutomodInfractions } = require('../functions/delete-expired-automod-infractions');

const DUPLICATE_MESSAGE_THRESHOLD = 3;
const DUPLICATE_MESSAGE_TIMEFRAME = 60 * 1000;
const MAX_EMOJI_COUNT = 7;
const MAX_LINE_COUNT = 6;
const MAX_CHARACTER_COUNT = 2000;

const recentMessages = new Map();

async function checkMessage(message) {
    const isStaff = config.staff.includes(message.author.id);
    const isOwner = config.owners.includes(message.author.id);
    const isBot = message.member.user.bot;

    if (isStaff || isOwner || isBot) {
        return;
    }

    const content = message.content.toLowerCase();

    if (await checkDuplicateMessage(message)) return;
    if (await checkLinks(message)) return;
    if (await checkMassEmoji(message)) return;
    if (await checkWallText(message)) return;

    const severeWord = severeWords.find(word => content.includes(word));
    if (severeWord) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'racist');
        await autoMute(message.member, 6, message, '[Automod] Use of racist terms.');
        return;
    }

    const filteredWord = filteredWords.find(word => content.includes(word));
    if (filteredWord) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'prohibited');
        await handleFilteredWord(message, filteredWord);
        return;
    }
}

async function checkDuplicateMessage(message) {
    const userId = message.author.id;
    const content = message.content;

    if (!recentMessages.has(userId)) {
        recentMessages.set(userId, []);
    }

    const userMessages = recentMessages.get(userId);
    const now = Date.now();

    while (userMessages.length > 0 && now - userMessages[0].timestamp > DUPLICATE_MESSAGE_TIMEFRAME) {
        userMessages.shift();
    }

    const duplicateCount = userMessages.filter(m => m.content === content).length;

    userMessages.push({ content, timestamp: now });

    if (duplicateCount >= DUPLICATE_MESSAGE_THRESHOLD) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'duplicate');
        await handleFilteredWord(message, '[Automod] Sending duplicate messages.');
        return true;
    }
    return false;
}

async function checkLinks(message) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    if (linkRegex.test(message.content)) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'links');
        await handleFilteredWord(message, '[Automod] Sending links.');
        return true;
    }
    return false;
}

async function checkMassEmoji(message) {
    const emojiRegex = /<a?:.+?:\d+>|\p{Extended_Pictographic}/gu;
    const emojiCount = (message.content.match(emojiRegex) || []).length;

    if (emojiCount > MAX_EMOJI_COUNT) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'emoji');
        await handleFilteredWord(message, '[Automod] Excessive emojis.');
        return true;
    }
    return false;
}

async function checkWallText(message) {
    const lines = message.content.split('\n');
    if (lines.length > MAX_LINE_COUNT || message.content.length > MAX_CHARACTER_COUNT) {
        await message.delete().catch(console.error);
        await sendAutomodMessage(message, 'walltext');
        await handleFilteredWord(message, '[Automod] Sending "walls" of spam or chaining messages.');
        return true;
    }
    return false;
}

async function sendAutomodMessage(message, type) {
    let content = '';
    switch (type) {
        case 'prohibited':
            content = 'you are not allowed to send prohibited words.';
            break;
        case 'duplicate':
            content = 'you are not allowed to send duplicate messages.';
            break;
        case 'links':
            content = 'you are not allowed to send links.';
            break;
        case 'emoji':
            content = 'you are not allowed to send excessive emojis.';
            break;
        case 'walltext':
            content = 'you are not allowed to send walls of text.';
            break;
        default:
            content = 'your message violated the rules.';
    }

    const msg = await message.channel.send(`<a:catbonk:1266005128557760564> <@${message.author.id}>, ${content} Continuing will result in a mute.`);
    setTimeout(() => {
        msg.delete().catch(console.error);
    }, 5000);
}

async function handleFilteredWord(message, reason) {
    const userId = message.member.id;

    const infractionID = await generateID();
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 1);
    const date = await formatDates(expiration);

    const warn = new Infraction({
        infractionId: infractionID,
        type: 'Warn',
        reason: reason,
        content: message.content,
        username: message.member.user.username,
        userId: message.member.id,
        moderator: message.client.user.username,
        moderatorId: message.client.user.id,
        issued: new Date(),
        expires: expiration,
    });

    await warn.save();

    const embed = new EmbedBuilder()
    .setColor('#fcd44f')
    .setAuthor({ name: `${message.client.user.username}`, iconURL: `${message.client.user.displayAvatarURL()}` })
    .setTitle(`You've been warned in ${message.guild.name}`)
    .addFields(
        { name: 'Reason', value: `${reason}` },
        { name: 'Expires', value: `${date}` }
    )
    .setFooter({ text: `Infraction ID: ${infractionID}` })
    .setTimestamp()
    await message.member.send({ embeds: [embed] }).catch(error => {
        console.error('An error occurred while sending this message to this user: ', error);
    });

    const recentWarns = await Infraction.countDocuments({
        userId,
        type: 'Warn',
        issued: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (recentWarns >= 2) {
        await autoMute(message.member, 4, message, '[Automod] Exceeding 2 warns within 5 minutes.');
        return;
    }

    const totalWarns = await Infraction.countDocuments({
        userId,
        type: 'Warn'
    });

    if (totalWarns >= 3) {
        await autoMute(message.member, 6, message, '[Automod] Exceeding 3 warnings.');
        return;
    }

    const totalMutesLastMonth = await Infraction.countDocuments({
        userId,
        type: 'Timeout',
        issued: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (totalMutesLastMonth >= 5) {
        await autoBan(message.member, message);
    }
}

async function autoMute(member, hours, reason) {
    try {
        const guildMember = await member.guild.members.fetch(member.id);
        await guildMember.timeout(hours * 60 * 60 * 1000, reason);

        const infractionID = await generateID();
        const expiration = new Date(Date.now() + hours * 60 * 60 * 1000);
        const duration = formatDates(expiration);

        const mute = new Infraction({
            infractionId: infractionID,
            type: 'Timeout',
            reason: reason,
            content: originalMessage.content,
            username: member.user.username,
            userId: member.id,
            moderator: member.guild.client.user.username,
            moderatorId: member.guild.client.user.id,
            issued: new Date(),
            duration: duration,
            expires: expiration,
        });

        await mute.save();

        const totalMutesLastMonth = await Infraction.countDocuments({
            userId: member.id,
            type: 'Timeout',
            issued: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const mutesLeft = 5 - totalMutesLastMonth;

        const embed = new EmbedBuilder()
            .setColor('#fcd44f')
            .setAuthor({ name: member.guild.client.user.username, iconURL: member.guild.client.user.displayAvatarURL() })
            .setTitle(`You've been muted in ${member.guild.name}`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Additional Information', value: `You have ${mutesLeft} more automute${mutesLeft > 1 ? 's' : ''} left this month before you get banned.` },
                { name: 'Expires', value: `${hours} hours` }
            )
            .setFooter({ text: `Punishment ID: ${punishmentID}` })
            .setTimestamp();
        await member.send({ embeds: [embed] }).catch(error => {
            console.error('An error occurred while sending this message to this user: ', error);
        });

        setTimeout(async () => {
            const unmuteEmbed = new EmbedBuilder()
                .setColor('#10b77f')
                .setAuthor({ name: member.guild.client.user.username, iconURL: member.guild.client.user.displayAvatarURL() })
                .setTitle(`You've been unmuted in ${member.guild.name}`)
                .addFields(
                    { name: 'Reason', value: '[Auto] Mute Cleared' }
                )
                .setFooter({ text: `Punishment ID: ${punishmentID}` })
                .setTimestamp();
            await member.send({ embeds: [unmuteEmbed] }).catch(error => {
                console.error('An error occurred while sending this message to this user: ', error);
            });
        }, hours * 60 * 60 * 1000);

        if (mutesLeft <= 0) {
            await autoBan(member, originalMessage);
        }
    } catch (error) {
        console.error('An error occurred while muting this member: ', error);
        const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while muting this member. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
    }
}

async function autoBan(member, originalMessage) {
    try {
        const infractionID = await generateID();

        const ban = new Infraction({
            infractionId: infractionID,
            type: 'Ban',
            reason: '[Automod] Exceeding 5 automod mutes within a month.',
            username: member.user.username,
            userId: member.id,
            moderator: member.guild.client.user.username,
            moderatorId: member.guild.client.user.id,
            issued: new Date(),
        });

        await ban.save();

        const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setAuthor({ name: member.guild.client.user.username, iconURL: member.guild.client.user.displayAvatarURL() })
            .setTitle(`You've been banned from ${member.guild.name}`)
            .setDescription('You may appeal your ban by clicking [here](<https://discord.gg/CzXTzKbgTV>).')
            .addFields(
                { name: 'Reason', value: '[Automod] Exceeding 5 automod mutes within a month.' }
            )
            .setFooter({ text: `Infraction ID: ${infractionID}` })
            .setTimestamp();

        await member.send({ embeds: [embed] }).catch(error => {
            console.error('An error occurred while sending this message to this user: ', error);
        });

        await member.ban({ reason: '[Automod] Exceeding 5 automod mutes within a month.' });
    } catch (error) {
        console.error('An error occurred while banning this member: ', error);
        const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while banning this member. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
    }
}

(async () => {
    setInterval(async () => {
        await deleteExpiredAutomodInfractions();
    }, 3600000); // Run every hour
})();

module.exports = { checkMessage };