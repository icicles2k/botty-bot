const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Display all commands or view information on a specific command.',
    category: 'util',
    staff: true,
    async execute(message, args, client) {
        const { commands } = client;

        if (!args.length) {
            const helpEmbed = new EmbedBuilder()
            .setColor('#a4bf8d')
            .setAuthor({ name: `Help | ${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}` })
            .addFields(
                { name: 'Config', value: '**`eval`**' },
                { name: 'Fun', value: '**`jigsaw`** **`bean`**' },
                { name: 'Util', value: '**`stats`** **`help`** **`whois`** **`membercount`** **`avatar`** **`rule`** **`ping`**' },
                { name: 'Moderation', value: '**`unmute`** **`mute`** **`warn`** **`warnings`** **`ban`** **`nick`** **`note`** **`infractioninfo`** **`blacklist`** **`unban`** **`slowmode`** **`rminfraction`** **`moderate`** **`reason`**' }
            )
            .setFooter({ text: 'Run >help <command> for more information on a specific command.' })
            return message.channel.send({ embeds: [helpEmbed] });
        } else {
            const name = args[0].toLowerCase();
            const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));

            if (!command) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This command does not exist.')
                const msg = await message.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            if (!command.info) {
                const embed = new EmbedBuilder()
                .setColor('#eb4034')
                .setDescription('This command does not have any information.')
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => {
                    message.delete();
                    msg.delete();
                }, 2000);

                return;
            }

            const infoEmbed = new EmbedBuilder()
            .setColor('#a4bf8d')
            .setTitle(`\`${command.name.charAt(0).toUpperCase() + command.name.slice(1)}\``)
            .setDescription(`${command.description}`)

            if (command.usage) {
                infoEmbed.addFields(
                    { name: 'Usage', value: `${command.usage}` }
                )
            }

            if (command.examples) {
                infoEmbed.addFields(
                    { name: 'Example(s)', value: `${command.examples.join('\n')}` }
                )
            }

            if (command.aliases && command.aliases.length > 0) {
                infoEmbed.addFields(
                    { name: 'Aliases', value: `${command.aliases.join(', ')}` }
                )
            }

            if (command.flags && command.flags.length > 0) {
                infoEmbed.addFields(
                    { name: 'Flags', value: `${command.flags.join(', ')}` }
                )
            }

            return message.channel.send({ embeds: [infoEmbed] });
        }
    },
};