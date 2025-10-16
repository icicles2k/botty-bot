const { EmbedBuilder } = require('discord.js');

function generateID() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = {
    name: 'moderate',
    description: 'Moderate a user\'s name.',
    usage: '>moderate [user: User]',
    examples: ['>moderate 792168652563808306'],
    aliases: ['mod', 'modnick'],
    staff: true,
    info: true,
    async execute(message, args) {
        const { guild, author, mentions } = message;

        if (!args.length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You must provide a member to moderate their nickname.')
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

        if (member.user.bot) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('You cannot moderate a bot\'s nickname.')
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
            .setDescription('You cannot moderate your own nickname.')
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
            .setDescription('You cannot moderate the nickname of a higher up.')
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
            .setDescription('You cannot moderate the nickname of a staff member with the same rank as you.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const reason = args.slice(1).join(' ');
        const moderatedNickname = `Moderated Nickname ${generateID()}`;

        await member.setNickname(moderatedNickname);
        await message.channel.send(`Moderated name to \`${moderatedNickname}\`.`);

        try {
            const embed = new EmbedBuilder()
            .setAuthor({ name: 'Nickname Moderated', iconURL: `${member.displayAvatarURL()}` })
            .setDescription(`Your nickname has been moderated in ${guild.name}. If you would like to change it, you may DM a staff member.`)
            .addFields(
                { name: 'Possible Reasons', value: '- Your name was in violation of rule 5.\n- Your name was not typeable on a standard English QWERTY keyboard.\n- Your name was too long/short.' }
            )
            .setTimestamp()
            return member.send({ embeds: [embed] }).catch(error => {
                console.error('Failed to send this message to this user: ', error);
            });
        } catch (error) {
            console.error('An error occurred while moderating this user\'s nickname: ', error);
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription('An error occurred while moderating this user\'s nickname. You may try again in a few minutes.')
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }
    }
}