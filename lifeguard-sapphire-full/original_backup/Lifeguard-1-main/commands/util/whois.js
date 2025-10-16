const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'whois',
    description: 'Get detailed information on a member.',
    staff: true,
    async execute(message, args) {
        let target = message.member;

        if (args.length > 0) {
            const member = message.mentions.members.first();
            if (member) {
                target = member;
            } else {
                const fetched = await message.guild.members.fetch(args[0]).catch(() => null);
                if (fetched) {
                    target = fetched;
                }
            }
        }

        const embed = new EmbedBuilder()
        .setAuthor({ name: `${target.user.username} (${target.id})`, iconURL: `${target.user.displayAvatarURL()}` })
        .setDescription(`<@${target.id}>`)
        .setThumbnail(target.user.displayAvatarURL())

        const fields = [];
        fields.push({ name: 'Username', value: `${target.user.username}`, inline: true })
        fields.push({ name: 'ID', value: `${target.id}`, inline: true })
        fields.push({ name: '\u200B', value: '\u200B', inline: true })
        fields.push({ name: 'Created At', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:F>`, inline: true })
        fields.push({ name: 'Joined At', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:F>`, inline: true })
        fields.push({ name: '\u200B', value: '\u200B', inline: true })

        const rolesList = target.roles.cache
        .filter(role => role.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .join(', ') || 'No roles found.';
        fields.push({ name: 'Role(s)', value: rolesList, inline: false })

        embed.addFields(fields);

        const roleColor = target.roles.highest.color || 0;
        embed.setColor(roleColor);
        return message.channel.send({ embeds: [embed] });
    },
};