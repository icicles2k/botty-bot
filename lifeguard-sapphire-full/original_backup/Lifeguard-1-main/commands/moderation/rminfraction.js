const { EmbedBuilder } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');

module.exports = {
    name: 'rminfraction',
    description: 'Removes an infraction from a user.',
    usage: '>rminfraction [ID: String]',
    examples: ['>rminfraction 1721880329092856932'],
    aliases: ['removeinfraction', 'rmstrike', 'rmpunish', 'removepunish', 'removestrike'],
    staff: true,
    info: true,
    async execute(message, args, client) {
        const { author, guild, member } = message;

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

        const isAdmin = member.roles.cache.some(role => role.name === 'Admin' || role.name === 'koholaz' || role.name === 'Owner');
        const isHeadMod = member.roles.cache.some(role => role.name === 'Head Moderator' || role.name === 'Admin' || role.name === 'koholaz' || role.name === 'Owner');
        const allFlag = args.includes('--all');
        const silentFlag = args.includes('--silent');

        if (allFlag && !isAdmin) {
            return message.delete();
        }

        let infractionId, userId;
        if (allFlag) {
            userId = args[0];
        } else {
            infractionId = args[0];
        }

        const removeInfraction = async (infractionToRemove, isSilent = false) => {
            try {
                await Infraction.findOneAndDelete({ infractionId: infractionToRemove.infractionId });

                if (!isSilent && !allFlag) {
                    const embed = new EmbedBuilder()
                    .setColor('#eb4034')
                    .setDescription('Infraction removed.')
                    message.channel.send({ embeds: [embed] });
                }

                if (!silentFlag) {
                    const user = await client.users.fetch(infractionToRemove.userId);
                    if (user) {
                        const removalEmbed = new EmbedBuilder()
                        .setColor('#10b77f')
                        .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
                        .setTitle(`One of your infractions was removed in ${guild.name}`)
                        .addFields(
                            { name: 'ID', value: `${infractionToRemove.infractionId}`, inline: true }
                        )
                        .setTimestamp()
                        await user.send({ embeds: [removalEmbed] }).catch(console.error);
                    }
                }
            } catch (error) {
                console.error('Failed to delete infractions: ', error);
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('Failed to delete infractions. You may try again in a few minutes.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }
        };

        if (allFlag) {
            try {
                const infractions = await Infraction.find({ userId });
                
                if (infractions.length === 0) {
                    return message.reply('This user has no strikes.');
                }

                for (const infraction of infractions) {
                    await removeInfraction(infraction, true);
                }

                const embed = new EmbedBuilder()
                    .setColor('#10b77f')
                    .setDescription(`Removed \`${infractions.length}\` infraction(s).`)
                return message.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to find infractions: ', error);
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('Failed to find infractions. You may try again in a few minutes.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }
        } else {
            let infraction;
            try {
                infraction = await Infraction.findOne({ infractionId });
            } catch (error) {
                console.error('Failed to find infractions: ', error);
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('Failed to find infractions. You may try again in a few minutes.')
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
                .setDescription('No infraction found with this ID.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            if (isHeadMod) {
                return removeInfraction(infraction);
            }

            const embed = new EmbedBuilder()
            .setTitle('Continue?')
            .setDescription(`Running this command permanently delete this infraction. If you have been given permission from a higher up, please respond to this message with \`yes\` in the next \`30 seconds\`.`)
            await message.channel.send({ embeds: [embed] });

            const filter = m => m.author.id === author.id && m.content.toLowerCase() === 'yes';
            const collector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });

            collector.on('collect', async () => {
                await removeInfraction(infraction);
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const embed = new EmbedBuilder()
                    .setColor('#eb4034')
                    .setDescription('Timed out.')
                    return message.channel.send({ embeds: [embed] }); 
                }
            });
        }
    }
}