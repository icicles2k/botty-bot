const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

const { generateID } = require('../../functions/generate-infraction-ids');

const unmuting = new Set();

module.exports = {
    name: 'unmute',
    description: 'Unmutes a member.',
    usage: '>unmute [user: User] <...reason: String>',
    examples: ['>unmute 792168652563808306 auto unmute stuck'],
    aliases: ['unshut', 'untimeout'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let reason;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to unmute.')
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

        if (unmuting.has(member.id)) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Whoops! Double unmute prevented.')
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

        unmuting.add(member.id);

        try {

            if (!member.isCommunicationDisabled()) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This user is not muted.')
                const msg = await message.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }


            const infractionID = await generateID();

            const untimeout = new Infraction({
                infractionId: infractionID,
                type: 'Untimeout',
                reason: reason,
                username: member.user.username,
                userId: member.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date(),
            });

            await untimeout.save();
            await member.timeout(null);

            await Infraction.findOneAndUpdate(
                { userId: member.id, type: 'Timeout' },
                { $set: { duration: new Date() } }
            );
            
            await message.delete();

            const embed = new EmbedBuilder()
            .setColor('#10b77f')
            .setDescription(`<@${member.id}> has been **unmuted** | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this unmute. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        } finally {
            unmuting.delete(member.id);
        }
    },
};