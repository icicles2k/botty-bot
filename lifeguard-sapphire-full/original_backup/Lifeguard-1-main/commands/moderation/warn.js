const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

const { deleteExpiredInfractions } = require('../../functions/delete-expired-infractions');
const { generateID } = require('../../functions/generate-infraction-ids');
const { formatDate } = require('../../functions/expiry-dates');

const warning = new Set();

const shortcuts = {
    beg: {
      reason: "Constantly begging for Nitro or other items.",
    },
    bypass: {
      reason:
        "Spelling words differently and/or editing punctuation to bypass the filter or sending a message with bypass via media attachments.",
    },
    chain: {
      reason: "Chaining lyrics, words or phrases.",
    },
    dm: {
      reason: "Unsolicited advertising in DMs.",
      aliases: ["ad"],
    },
    giveaway: {
      reason: "[GW] Trolling giveaway hosts.",
      aliases: ["gw"],
      additionalInfo: true,
      expires: 180,
    },
    lang: {
      reason: "Speaking in a foreign language.",
    },
    inappropriate: {
      reason:
        "Sending or implying a topic that is not suitable for younger users and/or is against the rules by messages, emojis images or other means.",
      aliases: ["inap"],
    },
  };

module.exports = {
    name: 'warn',
    description: 'Issues a warning.',
    usage: '>warn [user: User] <...reason: String>',
    examples: ['>warn 792168652563808306 spamming'],
    aliases: ['w', ...Object.keys(shortcuts), ...Object.values(shortcuts).flatMap((s) => s.aliases)],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let reason;
        let expires = new Date();
        expires.setDate(expires.getDate() + 30);

        const commandName = message.content.split(' ')[0].slice(1).toLowerCase();
        const shortcut = Object.entries(shortcuts).find(
            ([key, value]) =>
                key === commandName || (value.aliases && value.aliases.includes(commandName))
        );

        if (shortcut) {
            if (args.length === 0) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('You must provide a member to warn.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);
    
                return;
            }

            userId = mentions.users.first() ? mentions.users.first().id : args[0];
            reason = shortcut[1].reason;

            if (shortcut[1].expires) {
                expires.setDate(expires.getDate() + shortcut[1].expires);
            }
        } else {
            if (!args.length) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('You must provide a member to warn.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);
    
                return;
            }

            userId = mentions.users.first() ? mentions.users.first().id : args[0];
            reason = args.slice(1).join(' ');
        }

        let member;
        try {
            member = await guild.members.fetch(userId);
        } catch (error) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a valid user ID as the member is not in this server.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (member.user.bot) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot warn a bot.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (member.id === author.id) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot warn yourself.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (member.roles.highest.position > message.member.roles.highest.position) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot warn a higher up.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (member.roles.highest.position === message.member.roles.highest.position) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot warn a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (warning.has(member.id)) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Whoops! Double warn prevented.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (!reason) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a reason.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        warning.add(member.id);

        try {
            const infractionID = await generateID();

            const warn = new Infraction({
                infractionId: infractionID,
                type: 'Warn',
                reason: reason,
                username: member.user.username,
                userId: member.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date().toLocaleString(),
                expires: expires.toLocaleString(),
            });

            await warn.save();
            await message.delete();

            const embed = new EmbedBuilder()
            .setColor('#fcd44f')
            .setDescription(`<@${member.id}> has been **warned** | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });

            let additionalInfo = 'If you believe this punishment was false, you may DM one of the Head Moderators listed in <#1263994813741535242>.';

            const warnEmbed = new EmbedBuilder()
            .setColor('#fcd44f')
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTitle(`You've been warned in ${guild.name}`)
            .addFields(
                { name: 'Reason', value: `${reason}` },
                { name: 'Additional Information', value: `${additionalInfo}` },
                { name: 'Expires', value: `${formatDate(expires)}` }
            )
            .setFooter({ text: `Infraction ID: ${infractionID}` })
            .setTimestamp()
            await member.send({ embeds: [warnEmbed] }).catch((error) => {
                console.error(`Failed to send this message to ${member.user.username}: ${error}`);
            });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this warn. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        } finally {
            warning.delete(member.id);
        }
    },
};

(async () => {
    setInterval(async () => {
        await deleteExpiredInfractions();
    }, 86400000); // Run every day
})();
