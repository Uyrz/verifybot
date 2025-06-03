const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Sends a verification link.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('🔃 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId), // per-guild registration
      { body: commands },
    );
    console.log('✅ Slash command registered.');
  } catch (error) {
    console.error('❌ Failed to register:', error);
  }
})();
