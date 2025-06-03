const config = require('./config.json');
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

// --- Discord Bot Setup ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'verify') {
      // Only allow command in a specific channel
      if (interaction.channelId !== config.verifyChannelId) {
        return await interaction.reply({
          content: `❌ You can only use this command in <#${config.verifyChannelId}>.`,
          ephemeral: true
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('✅ Click to Verify')
          .setStyle(ButtonStyle.Link)
          .setURL(`${config.verifyBaseUrl}?user_id=${interaction.user.id}`)
      );

      await interaction.reply({
        content: 'Click the button below to verify your account:',
        components: [row],
        ephemeral: true
      });
    }
  }
});

client.login(config.token);

// --- Express Server Setup ---
const app = express();
const port = config.serverPort || 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/verify', (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).send('❌ Missing user ID in URL.');
  }

  res.send(`
    <html>
      <head><title>Verify</title></head>
      <body style="text-align:center; font-family:sans-serif; margin-top:50px;">
        <h2>🔐 Verification</h2>
        <p>User ID: <strong>${userId}</strong></p>
        <form method="POST" action="/confirm">
          <input type="hidden" name="user_id" value="${userId}" />
          <button type="submit" style="font-size:18px; padding:10px 20px; cursor:pointer;">✅ Confirm Verification</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/confirm', async (req, res) => {
  const userId = req.body.user_id;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const timestamp = new Date().toLocaleString('en-TH', { timeZone: 'Asia/Bangkok' });

  console.log(`✅ User ${userId} verified from IP ${ipAddress} at ${timestamp}`);

  try {
    const guild = await client.guilds.fetch(config.guildId);
    const member = await guild.members.fetch(userId);
    await member.roles.add(config.roleId);

    const logChannel = await client.channels.fetch(config.logChannelId);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send(
        `✅ **Verification Successful**\n` +
        `👤 User: <@${userId}>\n` +
        `🕒 Time: \`${timestamp} \`\n` +
        `🌐 IP Address: \`${ipAddress}\``
      );
    }

    res.send(`
      <html>
        <body style="text-align:center; font-family:sans-serif; margin-top:50px;">
          <h2>✅ Verification Successful</h2>
          <p>User <strong>${userId}</strong> has been given the role!</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(`❌ Failed to give role to ${userId}:`, err);
    res.status(500).send(`
      <html>
        <body style="text-align:center; font-family:sans-serif; margin-top:50px;">
          <h2>❌ Error</h2>
          <p>Could not assign role. Please contact an admin.</p>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`🌐 Web server running at http://localhost:${port}`);
});
