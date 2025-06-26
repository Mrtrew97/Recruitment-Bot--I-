require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ✅ Discord bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ✅ Webhook endpoint for Google Apps Script
app.post('/webhook', async (req, res) => {
  const data = req.body;

  if (
    !data ||
    !Array.isArray(data.answers) ||
    !Array.isArray(data.questions)
  ) {
    return res.status(400).send('Invalid data');
  }

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return res.status(404).send('Channel not found');

  const embeds = [];
  let currentEmbed = new EmbedBuilder()
    .setTitle("📥 New Recruitment Application")
    .setColor(0x00AE86)
    .setTimestamp(new Date());

  let fieldCount = 0;

  for (let i = 0; i < data.questions.length; i++) {
    // Convert to strings and truncate to Discord limits
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

  await channel.send({ embeds });
  res.status(200).send('Posted to Discord');
});

// ✅ Start both Express and the Discord client
client.login(TOKEN);
app.listen(PORT, () => console.log(`Webhook listening on port ${PORT}`));
