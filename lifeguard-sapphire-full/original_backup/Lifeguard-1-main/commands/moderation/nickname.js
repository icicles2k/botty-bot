const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Changes a user\'s nickname.',
    usage: '>nick: [user: User] <...nickname: String>',
    examples: [
        '>nick 792168652563808306',
        '>nick 792168652563808306 ice',
    ],
    aliases: ['nickname'],
    staff: true,
    info: true,
    async execute(message, args) {
        const { guild, author, mentions } = message;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to change their nickname.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const userId = mentions.users.first() ? mentions.users.first().id : args[0];
        const newNickname = args.slice(1).join(' ');
        let member;

        try {
            member = await guild.members.fetch(userId);
        } catch (error) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a valid user ID as the member is not in the server.')
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
            .setDescription('You cannot change the nickname of a higher up.')
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
            .setDescription('You cannot change the nickname of a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        if (!newNickname) {
            member.setNickname(null);
            await message.channel.send(`Nickname for **${member.user.username}** reset.`);
        } else {
            member.setNickname(newNickname);
            await message.channel.send(`Nickname set to \`${newNickname}\`.`);
        }
    },
};