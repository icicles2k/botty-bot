const { Command } = require('@sapphire/framework');
class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Ping'
    });
  }

  async messageRun(message) {
    return message.channel.send('Pong!');
  }
}
module.exports = { PingCommand };
