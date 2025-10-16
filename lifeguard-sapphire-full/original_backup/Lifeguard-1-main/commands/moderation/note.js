const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

const { generateID } = require('../../functions/generate-infraction-ids');

const noting = new Set();

module.exports = {
    name: 'note',
    description: 'Issues a note.',
    usage: '>note [user: User] <...reason: String>',
    examples: ['>note 792168652563808306 abusing gw perms'],
    aliases: ['n', 'ss'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let reason;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to note.')
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
            .setDescription('You cannot note a bot.')
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
            .setDescription('You cannot note yourself.')
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
            .setDescription('You cannot note a higher up.')
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
            .setDescription('You cannot note a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (noting.has(member.id)) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Whoops! Double note prevented.')
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

        noting.add(member.id);

        try {
            const infractionID = await generateID();

            const note = new Infraction({
                infractionId: infractionID,
                type: 'Note',
                reason: reason,
                username: member.user.username,
                userId: member.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date(),
            });

            await note.save();
            await message.delete();

            const embed = new EmbedBuilder()
            .setColor('#10b77f')
            .setDescription(`Added a note for <@${member.id}> | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });

            const noteEmbed = new EmbedBuilder()
            .setColor('#eb4034')
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .setTitle(`You've been noted in ${guild.name}`)
            .setDescription('You may appeal this note by messaging one of the Head Moderators [here](<https://discordapp.com/channels/1244116164410478763/1263994813741535242/1263994813741535242>).')
            .addFields(
                { name: 'Reason', value: `${reason}` },
            )
            .setFooter({ text: `Infraction ID: ${infractionID}` })
            .setTimestamp()
            await member.send({ embeds: [noteEmbed] }).catch((error) => {
                console.error(`Failed to send this message to ${member.user.username}: ${error}`);
            });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this note. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        } finally {
            noting.delete(member.id);
        }
    },
};