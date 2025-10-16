const { Command } = require('@sapphire/framework');
class MuteCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'mute',
      description: 'Mute a member (supports durations like 30d, 12h, 10m)',
    });
  }

  async messageRun(message) {
    try {
      const member = message.mentions.members.first();
      const parts = message.content.split(' ').slice(1);
      const durationArg = parts[1] || null;
      const reason = parts.slice(2).join(' ') || 'No reason provided';
      if (!member) return message.channel.send('Mention a member to mute.');
      function parseDur(s) {
        if(!s) return null;
        const m = s.match(/(\d+)([smhd])/);
        if(!m) return null;
        const n = parseInt(m[1],10);
        const unit = m[2];
        const mult = unit === 's'?1000:unit==='m'?60000:unit==='h'?3600000:86400000;
        return n * mult;
      }
      const durMs = parseDur(durationArg);
      const expiresAt = durMs ? new Date(Date.now()+durMs) : null;
      let muteRole = message.guild.roles.cache.find(r=>r.name.toLowerCase()==='muted');
      if(!muteRole) {
        muteRole = await message.guild.roles.create({ name: 'Muted', reason: 'Create mute role for bot' });
        for (const [, ch] of message.guild.channels.cache) {
          try { await ch.permissionOverwrites.edit(muteRole, { SendMessages: false, AddReactions: false, Speak: false }); } catch(e){}
        }
      }
      await member.roles.add(muteRole, `Muted by ${message.author.tag}: ${reason}`);
      const dbUser = await this.container.prisma.user.upsert({ where: { userId: member.id }, create: { userId: member.id }, update: {} });
      await this.container.prisma.punishment.create({
        data: {
          type: durMs ? 'TEMP_MUTE' : 'MUTE',
          userId: dbUser.id,
          guildId: message.guild.id,
          moderator: message.author.id,
          reason,
          expiresAt: expiresAt
        }
      });
      if (durMs) {
        await this.container.redis.set(`mute:${message.guild.id}:${member.id}`, '1', 'PX', durMs);
      } else {
        await this.container.redis.set(`mute:${message.guild.id}:${member.id}`, '1');
      }
      return message.channel.send(`${member.user.tag} has been muted${expiresAt?` until ${expiresAt.toUTCString()}`:''}. Reason: ${reason}`);
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred while muting.');
    }
  }
}
module.exports = { MuteCommand };
