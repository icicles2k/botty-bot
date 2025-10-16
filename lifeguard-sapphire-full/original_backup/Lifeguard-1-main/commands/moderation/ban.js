const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

const { generateID } = require('../../functions/generate-infraction-ids');

const banning = new Set();

module.exports = {
    name: 'ban',
    description: 'Bans a member from the guild.',
    usage: '>ban [user: User] <...reason: String>',
    examples: ['>ban 792168652563808306 5 strikes'],
    aliases: ['b'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let reason;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to ban.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        userId = mentions.users.first() ? mentions.users.first().id : args[0];
        reason = args.slice(1).join(' ');

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
            .setDescription('You cannot ban a bot.')
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
            .setDescription('You cannot ban yourself.')
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
            .setDescription('You cannot ban a higher up.')
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
            .setDescription('You cannot ban a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (banning.has(member.id)) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Whoops! Double ban prevented.')
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

        banning.add(member.id);

        try {
            const bans = await guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (bannedUser) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This member is already banned.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            const infractionID = await generateID();

            const ban = new Infraction({
                infractionId: infractionID,
                type: 'Ban',
                reason: reason,
                username: member.user.username,
                userId: member.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date(),
            });

            await ban.save();
            await message.delete();

            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription(`<@${member.id}> has been **banned** | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });

            const banEmbed = new EmbedBuilder()
            .setColor('#eb4034')
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTitle(`You've been banned from ${guild.name}`)
            .setDescription('You may appeal this ban by clicking [here](<https://discord.gg/CzXTzKbgTV>).')
            .addFields(
                { name: 'Reason', value: `${reason}` },
            )
            .setFooter({ text: `Infraction ID: ${infractionID}` })
            .setTimestamp()
            await member.send({ embeds: [banEmbed] }).catch((error) => {
                console.error(`Failed to send this message to ${member.user.username}: ${error}`);
            });

            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const channels = await guild.channels.fetch();

            for (const channel of channels.values()) {
                if (channel.isTextBased()) {
                    try {
                        let messagesDeleted = 0;
                        let lastId;

                        while(true) {
                            const messages = await channel.messages.fetch({ limit: 100, before: lastId });
                            if (messages.size === 0) break;

                            const userMessages = messages.filter(m => m.author.id === member.id && m.createdAt > oneDayAgo);
                            if (userMessages.size === 0) break;

                            await channel.bulkDelete(userMessages);
                            messagesDeleted += userMessages.size;

                            lastId = messages.last().id;

                            if (messages.size < 100) break;
                        }

                        if (messagesDeleted > 0) {
                            console.log(`Deleted ${messagesDeleted} message${messagesDeleted > 1 ? 's' : ''} from ${member.user.username}.`);
                        }
                    } catch (error) {
                        console.error('An error occurred while deleting this user\'s messages: ', error);
                    }
                }
            }
            await member.ban({ reason, deleteMessageSeconds: 1 });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this ban. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        } finally {
            banning.delete(member.id);
        }
    },
};