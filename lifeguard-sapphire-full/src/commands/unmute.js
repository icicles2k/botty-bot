const { Command } = require('@sapphire/framework');
class UnmuteCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'unmute',
      description: 'Unmute a member (manual unmute). Sends embed DM to the user.',
    });
  }

  async messageRun(message) {
    try {
      const member = message.mentions.members.first();
      if (!member) return message.channel.send('Mention a member to unmute.');
      const muteRole = message.guild.roles.cache.find(r=>r.name.toLowerCase()==='muted');
      if(muteRole && member.roles.cache.has(muteRole.id)) {
        await member.roles.remove(muteRole, `Unmuted by ${message.author.tag}`);
      }
      await this.container.redis.del(`mute:${message.guild.id}:${member.id}`);
      const dbUser = await this.container.prisma.user.findUnique({ where: { userId: member.id }});
      if (dbUser) {
        await this.container.prisma.punishment.updateMany({
          where: { userId: dbUser.id, type: 'TEMP_MUTE', active: true },
          data: { active: false, expiresAt: new Date() }
        });
      }
      try {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setTitle('You have been unmuted')
          .setDescription(`You were unmuted in **${message.guild.name}** by **${message.author.tag}**.`)
          .setTimestamp();
        await member.send({ embeds: [embed] }).catch(()=>{});
      } catch(e){}
      return message.channel.send(`${member.user.tag} has been unmuted.`);
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred while unmuting.');
    }
  }
}
module.exports = { UnmuteCommand };
