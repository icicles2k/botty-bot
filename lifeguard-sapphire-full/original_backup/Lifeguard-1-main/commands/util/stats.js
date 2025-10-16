const { exec } = require('child_process');
const { promisify } = require('util');
const { version: packageVersion } = require('../../package.json');

function formatUptime(uptime) {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);

    return `${days} day${days != 1 ? 's' : ''} ${hours} hour${hours != 1 ? 's' : ''} ${minutes} minute${minutes != 1 ? 's' : ''} ${seconds} second${seconds != 1 ? 's' : ''}`;
}

module.exports = {
    name: 'stats',
    description: "Get the bot's statistics.",
    staff: true,
    async execute(message) {
        const ping = message.client.ws.ping;

        const heapUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const rss = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

        const guildCount = message.client.guilds.cache.size;
        const uptime = formatUptime(process.uptime());

        return message.channel.send(`\`\`\`prolog\nVersion: ${packageVersion}\nUptime: ${uptime}\nGateway Ping: ${ping}ms\nHeap Usage: ${heapUsed} MB\nRSS Usage: ${rss} MB\nGuilds: ${guildCount}\`\`\``);
    },
};