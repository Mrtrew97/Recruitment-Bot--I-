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

  if (!data || !Array.isArray(data.answers)) {
    return res.status(400).send('Invalid data');
  }

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return res.status(404).send('Channel not found');

  const embed = new EmbedBuilder()
    .setTitle("📥 New Recruitment Application")
    .setColor(0x00AE86)
    .setTimestamp(new Date());

  for (let i = 0; i < data.questions.length; i++) {
    const question = data.questions[i];
    const answer = data.answers[i];
    embed.addFields({ name: question, value: answer || 'N/A' });
  }

  await channel.send({ embeds: [embed] });
  res.status(200).send('Posted to Discord');
});

// ✅ Start both Express and the Discord client
client.login(TOKEN);
app.listen(PORT, () => console.log(`Webhook listening on port ${PORT}`));
