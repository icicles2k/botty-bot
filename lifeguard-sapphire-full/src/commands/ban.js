const { Command } = require('@sapphire/framework');
class BanCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ban',
      description: 'Ban a member',
    });
  }

  async messageRun(message) {
    try {
      const target = message.mentions.members.first();
      const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';
      if (!target) return message.channel.send('Please mention a user to ban.');
      if (!target.bannable) return message.channel.send('I cannot ban this user.');
      await target.ban({ reason });
      const dbUser = await this.container.prisma.user.upsert({ where: { userId: target.id }, create: { userId: target.id }, update: {} });
      await this.container.prisma.punishment.create({
        data: {
          type: 'BAN',
          userId: dbUser.id,
          guildId: message.guild.id,
          moderator: message.author.id,
          reason
        }
      });
      return message.channel.send(`${target.user.tag} has been banned. Reason: ${reason}`);
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred while banning.');
    }
  }
}
module.exports = { BanCommand };
