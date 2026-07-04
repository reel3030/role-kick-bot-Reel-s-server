import express from "express";
import {
  Client,
  GatewayIntentBits
} from "discord.js";

const app = express();

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