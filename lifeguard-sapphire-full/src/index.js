require('dotenv').config();
const { SapphireClient } = require('@sapphire/framework');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const client = new SapphireClient({
  logger,
  intents: ['Guilds','GuildMembers','GuildMessages','MessageContent'],
  defaultPrefix: process.env.PREFIX || '!',
  caseInsensitiveCommands: true,
  loadMessageCommandListeners: true
});

client.prisma = require('./lib/prismaClient');
client.redis = require('./lib/redisClient');

client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
});

client.login(process.env.TOKEN).catch(err => {
  logger.error(err);
  process.exit(1);
});
