module.exports = {
    name: 'ping',
    description: 'Get the API latency and websocket heartbeat.',
    staff: true,
    async execute(message) {
        const start = performance.now();
        const msg = await message.channel.send('Pinging...');
        const end = performance.now();

        const timeTaken = Math.round(end - start);
        const ws = Math.round(message.client.ws.ping);

        return msg.edit(`Pong! (Roundtrip took: ${timeTaken}ms. Heartbeat: ${ws}ms.)`);
    },
};