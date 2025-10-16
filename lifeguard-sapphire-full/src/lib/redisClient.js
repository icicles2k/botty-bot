const Redis = require('ioredis');
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis', port: process.env.REDIS_PORT?parseInt(process.env.REDIS_PORT):6379, password: process.env.REDIS_PASSWORD||undefined });
redis.on('error', (e)=>console.error('Redis error', e));
module.exports = redis;
