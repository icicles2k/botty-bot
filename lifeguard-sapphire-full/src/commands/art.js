const { Command } = require('@sapphire/framework');
class ArtCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'art',
      description: 'Art shortcut: 1=ban 2=warn'
    });
  }

  async messageRun(message) {
    try {
      const parts = message.content.split(' ').slice(1);
      const flag = parts[0];
      const mention = message.mentions.users.first();
      const reason = parts.slice(1).join(' ') || 'No reason provided';
      if (!flag || !['1','2'].includes(flag)) return message.channel.send('Use art <1|2> @user [reason] — 1 = ban, 2 = warn');
      if (!mention) return message.channel.send('Mention a user.');
      if (flag === '1') {
        const member = message.guild.members.cache.get(mention.id);
        if (!member) return message.channel.send('Member not found.');
        if (!member.bannable) return message.channel.send('Cannot ban this member.');
        await member.ban({ reason });
        const dbUser = await this.container.prisma.user.upsert({ where: { userId: mention.id }, create: { userId: mention.id }, update: {} });
        await this.container.prisma.punishment.create({ data: { type: 'BAN', userId: dbUser.id, guildId: message.guild.id, moderator: message.author.id, reason }});
        return message.channel.send(`${mention.tag} banned (art 1).`);
      } else {
        const dbUser = await this.container.prisma.user.upsert({ where: { userId: mention.id }, create: { userId: mention.id }, update: {} });
        await this.container.prisma.punishment.create({ data: { type: 'WARN', userId: dbUser.id, guildId: message.guild.id, moderator: message.author.id, reason }});
        return message.channel.send(`${mention.tag} warned (art 2).`);
      }
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred in art command.');
    }
  }
}
module.exports = { ArtCommand };
