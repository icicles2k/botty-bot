const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');
const ms = require('ms');

const { deleteExpiredInfractions } = require('../../functions/delete-expired-infractions');
const { formatDates } = require('../../functions/expiry-dates');
const { generateID } = require('../../functions/generate-infraction-ids');

const muting = new Set();

module.exports = {
    name: 'mute',
    description: 'Mutes a member with a specified duration.',
    usage: '>mute [user: User] [duration: Time] <...reason: String>',
    examples: ['>mute 792168652563808306 8h spamming'],
    aliases: ['m', 'shut', 'timeout'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let duration;
        let reason;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to mute.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        userId = mentions.users.first() ? mentions.users.first().id : args[0];
        duration = ms(args[1]);
        reason = args.slice(2).join(' ');

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
            .setDescription('You cannot mute a bot.')
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
            .setDescription('You cannot mute yourself.')
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
            .setDescription('You cannot mute a higher up.')
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
            .setDescription('You cannot mute a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (muting.has(member.id)) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Whoops! Double mute prevented.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (!duration) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a duration.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (duration < 1000) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a valid duration (eg. `10s`, `30m`, `6h`).')
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

        muting.add(member.id);

        try {
            const infractionID = await generateID();
            const expiration = new Date();
            expiration.setMonth(expiration.getMonth() + 1);
            const durationTime = new Date(Date.now() + duration);
            const date = await formatDates(durationTime);

            const timeout = new Infraction({
                infractionId: infractionID,
                type: 'Timeout',
                reason: reason,
                username: member.user.username,
                userId: member.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date(),
                duration: date,
                expires: expiration,
            });

            if (member.isCommunicationDisabled()) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This user is already muted.')
                const msg = await message.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            await timeout.save();
            await member.timeout(duration, reason);
            await message.delete();

            const embed = new EmbedBuilder()
            .setColor('#fcd44f')
            .setDescription(`<@${member.id}> has been **muted** | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });

            const muteEmbed = new EmbedBuilder()
            .setColor('#fcd44f')
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTitle(`You've been muted in ${guild.name}`)
            .addFields(
                { name: 'Reason', value: `${reason}` },
                { name: 'Expires', value: `${date}` }
            )
            .setFooter({ text: `Infraction ID: ${infractionID}` })
            .setTimestamp()
            await member.send({ embeds: [muteEmbed] }).catch((error) => {
                console.error(`Failed to send this message to ${member.user.username}: ${error}`);
            });

            setTimeout(async () => {
                const activeTimeout = await Infraction.findOne({
                    infractionId: infractionID,
                });

                if (activeTimeout) {
                    const unmuteEmbed = new EmbedBuilder()
                    .setColor('#10b77f')
                    .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
                    .setTitle(`You've been unmuted in ${guild.name}`)
                    .addFields(
                        { name: 'Reason', value: '[Auto] Mute Cleared' }
                    )
                    .setFooter({ text: `Infraction ID: ${infractionID}` })
                    .setTimestamp()
                    await member.send({ embeds: [unmuteEmbed] }).catch((error) => {
                        console.error(`Failed to send this message to ${member.user.username}: ${error}`);
                    });
                }
            }, duration);
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this mute. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        } finally {
            muting.delete(member.id);
        }
    },
};

(async () => {
    setInterval(async () => {
        await deleteExpiredInfractions();
    }, 86400000); // Run every day
})();