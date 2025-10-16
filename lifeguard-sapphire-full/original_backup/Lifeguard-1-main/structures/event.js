const { readdirSync } = require('fs');
const { join } = require('path');

const loadEvents = (eventPath, client) => {
    const eventFiles = readdirSync(eventPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(join(eventPath, file));

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
};

module.exports = { loadEvents };