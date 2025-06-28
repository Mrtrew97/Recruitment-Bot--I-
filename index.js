require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ✅ Startup diagnostics
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const permissions = channel.permissionsFor(client.user);

    console.log("🔐 Bot permissions in channel:");
    console.log("  Add Reactions:", permissions.has(PermissionsBitField.Flags.AddReactions));
    console.log("  Send Messages:", permissions.has(PermissionsBitField.Flags.SendMessages));
    console.log("  Read Message History:", permissions.has(PermissionsBitField.Flags.ReadMessageHistory));

    // 🧪 Reaction test
    const testMessage = await channel.send("🧪 Reaction test message");
    await testMessage.react('✅');
    await testMessage.react('❌');
    console.log("✅ Reactions worked in startup test");

  } catch (err) {
    console.error("❌ Startup test or permission check failed:", err);
  }
});

// ✅ Webhook endpoint
app.post('/webhook', async (req, res) => {
  console.log("📡 POST /webhook received");

  const data = req.body;
  console.log("📥 Received data:", JSON.stringify(data, null, 2));

  if (
    !data ||
    !Array.isArray(data.answers) ||
    !Array.isArray(data.questions)
  ) {
    console.warn("❌ Invalid data structure");
    return res.status(400).send('Invalid data');
  }

  let channel;
  try {
    channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.warn("❌ Channel not found");
      return res.status(404).send('Channel not found');
    }
    console.log("✅ Channel fetched successfully");
  } catch (err) {
    console.error("❌ Failed to fetch channel:", err);
    return res.status(500).send('Failed to fetch channel');
  }

  const embeds = [];
  let currentEmbed = new EmbedBuilder()
    .setTitle("📥 New Recruitment Application")
    .setColor(0x00AE86)
    .setTimestamp(new Date());

  let fieldCount = 0;

  for (let i = 0; i < data.questions.length; i++) {
    const question = String(data.questions[i] ?? `Question ${i + 1}`).slice(0, 256);
    let answer = String(data.answers[i] ?? "N/A");

    if (answer.length > 1024) {
      answer = answer.slice(0, 1021) + "...";
    }

    currentEmbed.addFields({ name: question, value: answer });
    fieldCount++;

    if (fieldCount >= 25) {
      embeds.push(currentEmbed);
      currentEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTimestamp(new Date());
      fieldCount = 0;
    }
  }

  if (fieldCount > 0) {
    embeds.push(currentEmbed);
  }

  try {
    console.log("📤 Sending embed(s) to Discord...");
    const sentMessage = await channel.send({ embeds });
    console.log("✅ Embed(s) sent successfully");

    console.log("🔁 Trying to react with ✅...");
    await sentMessage.react('✅');
    console.log("✅ Reacted with ✅");

    console.log("🔁 Trying to react with ❌...");
    await sentMessage.react('❌');
    console.log("✅ Reacted with ❌");

    res.status(200).send('Posted to Discord');
  } catch (error) {
    console.error('❌ Error during message send or reaction:', error);
    res.status(500).send('Error posting to Discord');
  }
});

// ✅ UptimeRobot GET ping handler
app.get('/webhook', (req, res) => {
  res.status(200).send('Webhook endpoint is alive');
});

// ✅ Root GET handler
app.get('/', (req, res) => {
  res.status(200).send('Bot is running');
});

// ✅ Start Express and Discord client
client.login(TOKEN);
app.listen(PORT, () => console.log(`🚀 Webhook listening on port ${PORT}`));
