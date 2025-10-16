const { Listener } = require('@sapphire/framework');
class MuteExpiryChecker extends Listener {
  constructor(context, options) {
    super(context, { ...options, name: 'muteExpiryChecker' });
    this.interval = null;
  }
  async run() {
    if (this.interval) return;
    this.interval = setInterval(async () => {
      try {
        const prisma = this.container.prisma;
        const redis = this.container.redis;
        const now = new Date();
        const expiring = await prisma.punishment.findMany({ where: { type: 'TEMP_MUTE', active: true, expiresAt: { lte: now } }, include: { user: true }});
        for (const p of expiring) {
          await prisma.punishment.update({ where: { id: p.id }, data: { active: false }});
          try {
            const guild = this.container.client.guilds.cache.get(p.guildId);
            if (!guild) continue;
            const member = await guild.members.fetch(p.user.userId).catch(()=>null);
            if (!member) continue;
            const muteRole = guild.roles.cache.find(r=>r.name.toLowerCase()==='muted');
            if (muteRole && member.roles.cache.has(muteRole.id)) {
              await member.roles.remove(muteRole, 'Mute expired');
            }
            await redis.del(`mute:${p.guildId}:${member.id}`);
            // Important: do NOT DM or notify on expiry per user request
          } catch(e) { this.container.logger?.error(e); }
        }
      } catch(e) { this.container.logger?.error(e); }
    }, 30000);
  }
}
module.exports = { MuteExpiryChecker };
