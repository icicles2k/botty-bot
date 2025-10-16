const { EmbedBuilder } = require('discord.js');

const { generateID } = require('../../functions/generate-infraction-ids');

module.exports = {
    name: 'bean',
    description: 'Beans a member',
    staff: true,
    cooldown: 900,
    async execute(message, args) {
        const { guild, author, mentions } = message;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to bean.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const userId = mentions.users.first() ? mentions.users.first().id : args[0];
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

        if (member.id === author.id) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot bean yourself.')
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
            .setDescription('You cannot bean the superior overlords.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const beanID = await generateID();
        
        try {

            await message.delete();

            const beanEmbed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription(`**${member.user.username}** has been **beaned** | \`${beanID}\``)

            message.channel.send({ embeds: [beanEmbed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Failed to bean this member.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                 message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    },
};