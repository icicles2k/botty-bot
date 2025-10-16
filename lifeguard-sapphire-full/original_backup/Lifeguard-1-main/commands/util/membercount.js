const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'membercount',
    description: 'Get the membercount of the guild.',
    async execute(message) {
        const guild = message.guild;

        if (!guild) return;

        const members = await guild.members.fetch();
        const total = members.size;
        const humans = members.filter(member => !member.user.bot).size;
        const bots = members.filter(member => member.user.bot).size;

        const msg = total === 1 ? `There is **${total}** member in this server.` : `There are **${total}** members in this server.`;

        const embed = new EmbedBuilder()
        .setColor('#10b77f')
        .setAuthor({ name: 'Member Count', iconURL: `${message.client.user?.displayAvatarURL()}` })
        .setDescription(`${msg}\n**Humans:** ${humans}\n**Bots:** ${bots}`)
        return message.channel.send({ embeds: [embed] });
    },
};