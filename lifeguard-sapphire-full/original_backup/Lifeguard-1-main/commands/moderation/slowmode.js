const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Set a channel\'s slowmode.',
    usage: '>slowmode [duration: Time]',
    examples: ['>slowmode 30'],
    aliases: ['sm'],
    staff: true,
    info: true,
    async execute(message, args) {
        const { channel, member } = message;
        const currentSm = channel.rateLimitPerUser;

        if (!args.length) {
            return message.channel.send(`The current slowmode is **${currentSm}** ${currentSm === 1 ? 'second' : 'seconds'}.`);
        }

        let timeInSeconds;
        if (args[0].startsWith('+') || args[0].startsWith('-')) {
            const change = parseInt(args[0]);
            if (isNaN(change)) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('Please provide a valid number to change the slowmode to.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }
            timeInSeconds = currentSm + change;
        } else {
            timeInSeconds = parseInt(args[0]);
        }

        if (isNaN(timeInSeconds) || timeInSeconds < 0 || timeInSeconds > 21600) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('Please provide a valid number to change the slowmode to.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const requiredPermission = member.roles.cache.some(role => role.name === 'Trial Moderator');
        if (requiredPermission && timeInSeconds > 45) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setTitle('Continue?')
            .setDescription('You are restricted to `45 seconds` as a Trial Moderator. If you\'ve received permission from a higher up, please respond to this message with `yes` in the next `30 seconds`.')
            await message.channel.send({ embeds: [embed] });

            try {
                const collected = await message.channel.awaitMessages({
                    filter: m => m.author.id === message.author.id && m.content.toLowerCase() === 'yes',
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });

                if (collected.first().content.toLowerCase() !== 'yes') {
                    const embed = new EmbedBuilder()
                    .setColor('#eb4034')
                    .setDescription('Cancelled.')
                    return message.channel.send({ embeds: [embed] });
                }
            } catch (error) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('Timed out.')
                return message.channel.send({ embeds: [embed] });
            }
        }

        try {
            await channel.setRateLimitPerUser(timeInSeconds);
            const msg = timeInSeconds === 0
            ? 'Slowmode has been turned off, good luck!'
            : `Slowmode set to \`${timeInSeconds}\` ${timeInSeconds === 1 ? 'second' : 'seconds'}.`;
            return message.channel.send(msg);
        } catch (error) {
            console.error('An error occurred while setting this channel\'s slowmode: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while setting this channel\'s slowmode. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    },
};