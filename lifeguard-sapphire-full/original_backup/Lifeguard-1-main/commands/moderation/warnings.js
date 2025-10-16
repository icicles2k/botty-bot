const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Infraction = require('../../schemas/manual-infraction');
const { staff } = require('../../config');

module.exports = {
    name: 'warnings',
    description: 'Shows modlogs (strikes) for a user.',
    usage: '>warnings [user: User]',
    examples: ['>warnings 792168652563808306'],
    aliases: ['warns', 'modlogs', 'strikes', 'infractions'],
    info: true,
    async execute(message, args, client) {
        const { author, mentions } = message;
        const staffMembers = staff;

        let targetUser = mentions.users.first();
        if (!targetUser && args[0]) {
            try {
                targetUser = await client.users.fetch(args[0]);
            } catch (error) {
                console.error('An error occurred while fetching this user:', error);
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('An error occurred while fetching this user. You may try again in a few minutes.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }
        }

        if (!targetUser || !staffMembers) {
            targetUser = author;
        }

        const viewUserInfractions = staffMembers.includes(message.author.id);

        try {
            let infractions;
            infractions = await Infraction.find({ userId: targetUser.id }) || [];

            if (infractions.length === 0) {
                const msg = targetUser.id === author.id ? 'You have no strikes.' : `${targetUser.username} has no strikes.`;
                return message.reply(msg);
            } else {
                const embeds = [];
                let currentEmbed = new EmbedBuilder()
                .setAuthor({ name: `${targetUser.username}`, iconURL: `${targetUser.displayAvatarURL()}` })
                .setDescription(`All infractions for <@${targetUser.id}>`)

                let fieldCount = 0;

                infractions.forEach(infraction => {
                    const issued = `<t:${Math.floor(infraction.issued.getTime() / 1000)}:R>`;
                    const moderator = viewUserInfractions ? `Moderator: ${infraction.moderator}`: 'Moderator: Hidden';

                    currentEmbed.addFields(
                        { name: `ID: ${infraction.infractionId} | ${moderator}`, value: `**${infraction.type}** - ${infraction.reason} - ${issued}` }
                    );

                    fieldCount++;

                    if (fieldCount === 10) {
                        embeds.push(currentEmbed);
                        currentEmbed = new EmbedBuilder()
                        .setAuthor({ name: `${targetUser.username}`, iconURL: `${targetUser.displayAvatarURL()}` })
                        .setDescription(`All infractions for <@${targetUser.id}>`)
                        fieldCount = 0;
                    }
                });

                if (fieldCount > 0) {
                    embeds.push(currentEmbed);
                }

                let currentPage = 0;
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('<')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('>')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(embeds.length === 1)
                    );

                if (infractions.length > 10) {
                    const reply = await message.channel.send({ embeds: [embeds[0]], components: [row] });

                    const collector = reply.createMessageComponentCollector({ time: 60000 });

                    collector.on('collect', async i => {
                        if (i.user.id === message.author.id) {
                            if (i.customId === 'previous') {
                                currentPage--;
                            } else if (i.customId === 'next') {
                                currentPage++;
                            }

                            row.components[0].setDisabled(currentPage === 0);
                            row.components[1].setDisabled(currentPage === embeds.length - 1);

                            await i.update({ embeds: [embeds[currentPage]], components: [row] });
                        } else {
                            await i.reply({ content: 'This is not your component.', ephemeral: true });
                        }
                    });

                    collector.on('end', () => {
                        row.components.forEach(button => button.setDisabled(true));
                        reply.edit({ components: [row] });
                    });
                } else {
                    await message.channel.send({ embeds: [embeds[0]] });
                }
            }
        } catch (error) {
            console.error('An error occurred while fetching infractions: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while fetching infractions. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    },
};