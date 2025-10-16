const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

module.exports = {
    name: 'reason',
    description: 'Edits the reason of an infraction.',
    usage: '>reason [infractionID: String] <...reason: String>',
    examples: ['>reason 1721885874987701902 Misconduct in chat.'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { guild } = message;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide an infraction ID.');
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const infractionID = args[0];
        const newReason = args.slice(1).join(' ');

        if (!newReason) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a reason.');
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        try {
            const infraction = await Infraction.findOne({ infractionId: infractionID });

            if (!infraction) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription(`Infraction not found.`);
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            infraction.reason = newReason;
            await infraction.save();

            const embed = new EmbedBuilder()
            .setColor('#10b77f')
            .setDescription(`Sucessfully updated the reason for this infraction.`);
            message.channel.send({ embeds: [embed] });

            const user = await client.users.fetch(infraction.userId);
            if (user) {
                const reasonEmbed = new EmbedBuilder()
                    .setColor('#10b77f')
                    .setDescription(`Your infraction in ${guild.name} has been updated.`)
                    .addFields(
                        { name: 'New Reason', value: newReason },
                    )
                user.send({ embeds: [reasonEmbed] }).catch(console.error);
            }
        } catch (error) {
            console.error('Error updating reason:', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while updating this reason. You may try again in a few minutes.');
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    },
};