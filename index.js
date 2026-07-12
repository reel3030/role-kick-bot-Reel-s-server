import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Captcha } from "captcha-canvas";
import crypto from "crypto";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
const captchas = new Map();
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", async () => {
  console.log(`Bot ready: ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.members.fetch();

  const threeDays = 1000 * 60 * 60 * 24 * 3;

  for (const member of guild.members.cache.values()) {
    try {
      if (member.user.bot) continue;

      if (!member.joinedAt) continue;

      if (Date.now() - member.joinedAt.getTime() < threeDays) {
        continue;
      }

      if (member.roles.cache.has(process.env.TARGET_ROLE_ID)) {
        continue;
      }

      try {
        await member.send(
          "3日以内に認証ロールが付与されなかったため、サーバーから退出となりました。\n dsc.gg/reel-server こちらから再参加が可能です。",
        );
      } catch {
        console.log(`${member.user.tag} にDMを送信できませんでした。`);
      }

      await member.kick(
        "3日以内に認証ロールが付与されなかったため botによりkickされました。",
      );

      console.log(`${member.user.tag} をKickしました。`);
    } catch (err) {
      console.error(`${member.user.tag} の処理中にエラー:`, err);
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  console.log(`${member.user.tag} が参加しました`);

  const threeDays = 1000 * 60 * 60 * 24 * 3;

  setTimeout(async () => {
    try {
      const freshMember = await member.guild.members.fetch(member.id);

      if (freshMember.roles.cache.has(process.env.TARGET_ROLE_ID)) {
        return;
      }

      try {
        await freshMember.send(
          "3日以内に認証ロールが付与されなかったため、サーバーから退出となりました。",
        );
      } catch {
        console.log(`${freshMember.user.tag} にDMを送信できませんでした。`);
      }

      await freshMember.kick("3日以内に認証ロールが付与されなかったため");

      console.log(`${freshMember.user.tag} をKickしました。`);
    } catch (err) {
      console.error(`${member.user.tag} の確認中にエラー:`, err);
    }
  }, threeDays);
});

client.on("messageCreate", async (message) => {
  console.log(message.content);

  if (message.author.bot) return;

  if (message.content !== "rsbot!verify") return;

  if (!message.member.roles.cache.has(process.env.VERIFY_MANAGER_ROLE_ID)) {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("認証")
    .setDescription(
      "認証をすると、<@&1467451539722342552>が付与され、サーバーで喋れるようになります。",
    )
    .setColor("Green");

  const button = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("認証する")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  await message.channel.send({
    embeds: [embed],
    components: [row],
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId !== "verify") return;

  await interaction.deferReply({
    ephemeral: true,
  });

  const answer = crypto.randomBytes(3).toString("hex").toUpperCase();

  const captcha = new Captcha();

  captcha.async = true;
  captcha.width = 300;
  captcha.height = 100;
  captcha.text = answer;

  captcha.addDecoy(5);
  captcha.drawTrace();

  const buffer = await captcha.png;
  const attachment = new AttachmentBuilder(buffer, {
    name: "captcha.png",
  });

  const answerButton = new ButtonBuilder()
    .setCustomId("captcha_answer")
    .setLabel("回答する")
    .setStyle(ButtonStyle.Primary);

  const answerRow = new ActionRowBuilder().addComponents(answerButton);

  captchas.set(interaction.user.id, answer);

  await interaction.editReply({
    content: "画像に表示されている文字を入力してください。",
    files: [attachment],
    components: [answerRow],
  });
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
