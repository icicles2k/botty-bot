const { ActivityType, Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const loadCommands = require('./structures/command');
const { loadEvents } = require('./structures/event');
const { join } = require('path');
const { handleMessage } = require('./listeners/messageCreate');
const { checkMessage } = require('./systems/automod');

const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const activities = [
    { name: 'my dog', type: ActivityType.Watching },
    { name: 'over the server', type: ActivityType.Watching },
    { name: 'out for commands', type: ActivityType.Watching },
    { name: 'out for staff apps', type: ActivityType.Watching },
    { name: 'Spotify', type: ActivityType.Listening },
    { name: 'Apple Music', type: ActivityType.Listening },
    { name: 'commands', type: ActivityType.Listening },
    { name: 'Roblox', type: ActivityType.Playing },
    { name: 'Minecraft', type: ActivityType.Playing },
    { name: 'Fortnite with antoma20', type: ActivityType.Playing },
    { name: 'with Kai Cenat', type: ActivityType.Streaming, url: 'https://www.twitch.tv/kaicenat' }
];

let currentIndex = 0;

setInterval(() => {
    const activity = activities[currentIndex];
    client.user.setActivity(activity.name, { type: activity.type });
    currentIndex = (currentIndex + 1) % activities.length;
}, 30000);

mongoose.connect(process.env.DATABASE_URL, {
}).then(() => {
    console.log('Connected to MongoDB.');
}).catch(err => {
    console.log(err);
});

loadCommands(client);
loadEvents(join(__dirname, './listeners'), client);

client.on('messageCreate', async (message) => {
    await handleMessage(message, client);
    await checkMessage(message);
});

client.on('ready', () => {
    console.log(`Loaded ${client.commands.size} command${client.commands.size > 1 ? 's' : ''}.`);
    console.log('Connected to Discord.');
});

client.login(process.env.CLIENT_TOKEN);