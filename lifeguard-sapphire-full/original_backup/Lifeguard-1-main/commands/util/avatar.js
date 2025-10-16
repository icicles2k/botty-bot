const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Get the avatar of a member.',
    aliases: ['av'],
    staff: true,
    async execute(message, args) {
        let target = message.author;

        if (args.length > 0) {
            const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
            if (user) {
                target = user;
            }
        }

        const embed = new EmbedBuilder()
        .setAuthor({ name: `${target.username}'s Avatar`, iconURL: `${target.displayAvatarURL()}` })
        .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
        return message.channel.send({ embeds: [embed] });
    },
};