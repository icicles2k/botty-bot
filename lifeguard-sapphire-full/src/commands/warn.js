const { Command } = require('@sapphire/framework');
class WarnCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'warn',
      description: 'Warn a member',
    });
  }

  async messageRun(message) {
    try {
      const target = message.mentions.users.first();
      const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';
      if (!target) return message.channel.send('Please mention a user to warn.');
      const dbUser = await this.container.prisma.user.upsert({
        where: { userId: target.id },
        create: { userId: target.id },
        update: {}
      });
      await this.container.prisma.punishment.create({
        data: {
          type: 'WARN',
          userId: dbUser.id,
          guildId: message.guild.id,
          moderator: message.author.id,
          reason
        }
      });
      await message.channel.send(`${target.tag} has been warned. Reason: ${reason}`);
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred while warning.');
    }
  }
}
module.exports = { WarnCommand };
