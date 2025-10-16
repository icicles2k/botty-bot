const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

const { generateID } = require('../../functions/generate-infraction-ids');

module.exports = {
    name: 'unban',
    description: 'Unbans a member from the guild.',
    usage: '>unban [user: User] <...reason: String>',
    examples: ['>unban 792168652563808306 appeal accepted'],
    aliases: ['ub'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild, author, mentions } = message;

        let userId;
        let reason;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to unban.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        userId = mentions.users.first() ? mentions.users.first().id : args[0];
        reason = args.slice(1).join(' ');

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

        try {
            const bans = await guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This user is not banned.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            const infractionID = await generateID();

            const unban = new Infraction({
                infractionId: infractionID,
                type: 'Unban',
                reason: reason,
                username: bannedUser.user.username,
                userId: bannedUser.user.id,
                moderator: author.username,
                moderatorId: author.id,
                issued: new Date(),
            });

            await unban.save();
            await guild.members.unban(userId);

            const embed = new EmbedBuilder()
            .setColor('#10b77f')
            .setDescription(`**${bannedUser.user.username}** has been **unbanned** | \`${infractionID}\``)
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to process this unban. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    },
};