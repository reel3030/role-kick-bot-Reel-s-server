import express from "express";
import {
  Client,
  GatewayIntentBits
} from "discord.js";

const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("clientReady", () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.login(process.env.TOKEN);

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web server started on port ${PORT}`);
});