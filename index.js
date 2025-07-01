const { Client, Collection, GatewayIntentBits, Partials, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});
client.commands = new Collection();
const cmdsPath = path.join(__dirname, 'commands');
const cmdFiles = fs.readdirSync(cmdsPath).filter(f => f.endsWith('.js'));
const commandData = [];
for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    commandData.push(cmd.data.toJSON());
  }
}
client.once(Events.ClientReady, async () => {
  console.log(`${client.user.tag} is online`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandData }
    );
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
});
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction, client);
    } else if (interaction.isButton()) {
      for (const cmd of client.commands.values()) {
        if (typeof cmd.handleComponent === 'function') {
          const handled = await cmd.handleComponent(interaction, client);
          if (handled) break;
        }
      }
    } else if (interaction.isModalSubmit()) {
      for (const cmd of client.commands.values()) {
        if (typeof cmd.handleModalSubmit === 'function') {
          const handled = await cmd.handleModalSubmit(interaction, client);
          if (handled) break;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ There was an error processing this interaction.', ephemeral: true });
    } else {
      await interaction.followUp({ content: '❌ There was an error processing this interaction.', ephemeral: true });
    }
  }
});
client.login(process.env.DISCORD_TOKEN);