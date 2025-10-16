const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

module.exports = {
    name: 'punishinfo',
    description: 'View information on a user\'s infraction.',
    usage: '>infractioninfo <ID: String>',
    aliases: ['info', 'case'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild } = message;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Please provide an infraction ID.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const infractionId = args[0];
        let infraction;

        try {
            infraction = await Infraction.findOne({ infractionId });
        } catch (error) {
            console.error('An error occurred while finding this infraction: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while finding this infraction. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (!infraction) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('There was no infraction found with this ID.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        let user, moderator;
        try {
            user = await client.users.fetch(infraction.userId);
            moderator = await client.users.fetch(infraction.moderatorId);
        } catch (error) {
            console.error('An error occurred while fetching user or moderator information: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while fetching user or moderator information. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (!user || !moderator) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('User or moderator not found.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const embed = new EmbedBuilder()
        .setColor('#fcd44f')
        .setAuthor({ name: `${user.username} (${user.id})`, iconURL: `${user.displayAvatarURL({ dynamic: true }) }` })
        .addFields(
            { name: 'Type', value: `${infraction.type}` },
            { name: 'Moderator', value: `${moderator.username} (${moderator.id})` },
            { name: 'User', value: `${user.username} (${user.id})` },
            { name: 'Reason', value: `${infraction.reason}` },
            { name: 'Time', value: `<t:${Math.floor(infraction.issued.getTime() / 1000)}:F>` },
            { name: 'Expires', value: infraction.expires ? `<t:${Math.floor(infraction.expires.getTime() / 1000)}:F>` : '*Never*' },
        )
        .setFooter({ text: `Infraction ID: ${infractionId}` })
        return message.channel.send({ embeds: [embed] }).catch(error => {
            console.error('An error occurred while sending infraction details: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while sending infraction details. You may try again in a few minutes.')
            const msg = message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        });
    },
};