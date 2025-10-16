const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const { Collection } = require('discord.js');

function loadCommands(dir, client) {
    const files = readdirSync(dir);

    for (const file of files) {
        const filePath = join(dir, file);
        const stats = statSync(filePath);

        if (stats.isDirectory()) {
            loadCommands(filePath, client);
        } else if (file.endsWith('.js')) {
            try {
                const command = require(filePath);
                if (command.name) {
                    client.commands.set(command.name, command);
                }

                if (command.aliases && Array.isArray(command.aliases)) {
                    const aliases = command.aliases.filter((alias, index, self) => self.indexOf(alias) === index);
                    aliases.forEach(alias => {
                        client.aliases.set(alias, command.name);
                    });
                }
            } catch (error) {
                console.error(`An error occurred while loading the ${file} command: ${error}`);
            }
        }
    }
}

module.exports = (client) => {
    client.commands = new Collection();
    client.aliases = new Collection();

    const commandPath = join(__dirname, '../commands');
    loadCommands(commandPath, client);
};