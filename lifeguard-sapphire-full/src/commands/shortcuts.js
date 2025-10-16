const { Command } = require('@sapphire/framework');
class ShortcutsCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'shortcuts',
      description: 'Manage command shortcuts: create, delete, list, run'
    });
  }

  async messageRun(message) {
    try {
      const [sub, name, ...rest] = message.content.split(' ').slice(1);
      if (!sub) return message.channel.send('Usage: shortcuts <create|delete|list|run> ...');
      if (sub === 'create') {
        if (!name) return message.channel.send('Provide a name for the shortcut.');
        const commandText = rest.join(' ');
        await this.container.prisma.shortcut.create({
          data: { guildId: message.guild.id, name, command: commandText }
        });
        return message.channel.send(`Shortcut '${name}' created.`);
      } else if (sub === 'delete') {
        if (!name) return message.channel.send('Provide a shortcut name to delete.');
        await this.container.prisma.shortcut.deleteMany({ where: { guildId: message.guild.id, name }});
        return message.channel.send(`Shortcut '${name}' deleted.`);
      } else if (sub === 'list') {
        const list = await this.container.prisma.shortcut.findMany({ where: { guildId: message.guild.id }});
        if (!list.length) return message.channel.send('No shortcuts.');
        return message.channel.send(list.map(s=>`${s.name} -> ${s.command}`).join('\n'));
      } else if (sub === 'run') {
        if (!name) return message.channel.send('Provide a shortcut name to run.');
        const s = await this.container.prisma.shortcut.findFirst({ where: { guildId: message.guild.id, name }});
        if (!s) return message.channel.send('Shortcut not found.');
        return message.channel.send(`Shortcut '${name}': ${s.command}`);
      } else {
        return message.channel.send('Unknown subcommand for shortcuts.');
      }
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred in shortcuts command.');
    }
  }
}
module.exports = { ShortcutsCommand };
