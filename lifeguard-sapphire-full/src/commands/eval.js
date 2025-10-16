const { Command } = require('@sapphire/framework');
class EvalCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'eval',
      description: 'Evaluate JS (owner only)'
    });
  }

  async messageRun(message) {
    try {
      const owner = process.env.OWNER_ID;
      if (!owner) return message.channel.send('No OWNER_ID set in .env.');
      if (message.author.id !== owner) return message.channel.send('Only the owner can use this.');
      const code = message.content.split(' ').slice(1).join(' ');
      if (!code) return message.channel.send('Provide code to eval.');
      try {
        let result = eval(code);
        if (result instanceof Promise) result = await result;
        return message.channel.send('`' + require('util').inspect(result, { depth: 1 }) + '`');
      } catch (err) {
        return message.channel.send('Error: ' + err.message);
      }
    } catch (error) {
      this.container.logger?.error(error);
      return message.channel.send('An error occurred in eval command.');
    }
  }
}
module.exports = { EvalCommand };
