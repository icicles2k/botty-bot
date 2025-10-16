const { inspect } = require('util');

module.exports = {
    name: 'eval',
    description: 'Evaluate JavaScript code.',
    usage: '>eval [code] [--silent|-s]',
    examples: ['>eval 1 + 1', '>eval console.log("Hello") -s'],
    aliases: ['ev'],
    owner: true,
    async execute(message, args, client) {
        let silent = false;
        if (args[args.length - 1] === '--silent' || args[args.length - 1] === '-s') {
            silent = true;
            args.pop();
        }

        const code = args.join(' ');
        
        // Check if the command attempts to access .env variables
        if (code.toLowerCase().includes('process.env')) {
            return;
        }

        try {
            let evaled = eval(code);
            if (typeof evaled !== 'string') {
                evaled = inspect(evaled);
            }
            
            if (silent) {
                await message.delete();
                return;
            }
            
            await message.channel.send(`\`\`\`js\n${evaled}\n\`\`\``);
        } catch (error) {
            const failMsg = await message.channel.send(`**Error:** \`\`\`js\n${error.name}: ${error.message}\n\`\`\``);
            setTimeout(() => {
                if (silent) {
                    message.delete();
                }
                failMsg.delete();
            }, 2000);
        }
    },
};