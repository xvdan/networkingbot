import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import url from "url";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";
import { detectBadWords, checkSpam } from "./modules/automod.js";
import antilinkData from "./antilink.json" assert { type: "json" };



// 🧭 Setup file paths
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ Load config file
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const logger = pino({ level: "silent" });

// 🧩 Load command files
const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;
  const { default: command } = await import(`./commands/${file}`);
  if (!command?.name || typeof command.execute !== "function") {
    console.log(`⚠️ Skipped invalid command file: ${file}`);
    continue;
  }
  commands.set(command.name, command);
  console.log(`✅ Loaded command: ${command.name}`);
}

// 🚀 Start bot function
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: [config.botName || "TheBagBot", "Chrome", "1.0"],
  });

  // 🔁 Save credentials
  sock.ev.on("creds.update", saveCreds);

  // 🌐 Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 🧾 Show QR Code manually if needed
    if (qr) {
      console.log("📱 Scan this QR Code using your WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log(`✅ ${config.botName} connected successfully!`);
      console.log(`🔗 Linked WhatsApp ID: ${sock.user.id}`);
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log("⚠️ Connection closed. Reconnecting...");
      if (reason === DisconnectReason.loggedOut) {
        console.log("🗑️ Removing old session...");
        fs.rmSync("auth_info", { recursive: true, force: true });
      }
      setTimeout(startBot, 2000);
    }
  });

  const fakeTypingSettings = fs.existsSync("./faketyping.json")
  ? JSON.parse(fs.readFileSync("./faketyping.json", "utf8"))
  : {};


  const autoBlueSettings = fs.existsSync("./autoblue.json")
  ? JSON.parse(fs.readFileSync("./autoblue.json", "utf8"))
  : {};
  // 💬 Listen for messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const messageContent =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      "";
    const text = messageContent.trim();
    if (!text) return;

    console.log("💬 Received:", text);


// If Auto Blue Ticks is ON, mark message as read
  if (autoBlueSettings.enabled) {
    try {
      await sock.readMessages([m.key]);
      console.log(`✅ Auto-read message from ${from}`);
    } catch (err) {
      console.error("⚠️ AutoBlue error:", err);
    }
  }


// 👇 If fake typing is enabled, simulate typing for 3 seconds
  if (fakeTypingSettings[from]) {
    await sock.sendPresenceUpdate("composing", from);
    await new Promise((r) => setTimeout(r, 3000));
    await sock.sendPresenceUpdate("paused", from);
  }



    // 🧠 Anti-Link System
const groupMetadata = m.key.remoteJid.endsWith("@g.us")
  ? await sock.groupMetadata(from).catch(() => null)
  : null;

if (groupMetadata && antilinkData.enabledGroups.includes(from)) {
  const isAdmin = groupMetadata.participants.some(
    (p) =>
      p.id === (m.key.participant || m.key.remoteJid) &&
      (p.admin === "admin" || p.admin === "superadmin")
  );

  const linkRegex = /(https?:\/\/[^\s]+)/gi;

  if (linkRegex.test(text) && !isAdmin) {
    try {
      // 🚨 Delete message
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant,
        },
      });

      // ⚠️ Warn the user
      await sock.sendMessage(from, {
        text: `⚠️ @${(m.key.participant || "").split("@")[0]}, posting links is not allowed here!`,
        mentions: [m.key.participant],
      });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  }
}

const alwaysOnlineSettings = fs.existsSync("./alwaysonline.json")
  ? JSON.parse(fs.readFileSync("./alwaysonline.json", "utf8"))
  : {};

if (alwaysOnlineSettings.enabled) {
  setInterval(async () => {
    try {
      await sock.sendPresenceUpdate("available");
    } catch (err) {
      console.error("⚠️ AlwaysOnline error:", err);
    }
  }, 10000); // every 10 seconds refresh presence
}


// 🫶 Auto React Feature


let autoreactSettings = {};
if (fs.existsSync("./autoreact.json")) {
  autoreactSettings = JSON.parse(fs.readFileSync("./autoreact.json", "utf8"));
}

if (autoreactSettings[from]) {
  const lowerText = text.toLowerCase();
  const reactions = {
    hello: "👋",
    lol: "😂",
    thanks: "🙏",
    love: "❤️",
    goodnight: "🌙",
    morning: "☀️",
  };

  for (const [word, emoji] of Object.entries(reactions)) {
    if (lowerText.includes(word)) {
      await sock.sendMessage(from, { react: { text: emoji, key: m.key } });
      break;
    }
  }
}

// 🎨 Custom Reactions (from customReacts.json)
let customReacts = {};
if (fs.existsSync("./customReacts.json")) {
  customReacts = JSON.parse(fs.readFileSync("./customReacts.json", "utf8"));
}

if (autoreactSettings[from] && customReacts[from]) {
  const lowerText = text.toLowerCase();
  for (const [word, emoji] of Object.entries(customReacts[from])) {
    if (lowerText.includes(word)) {
      await sock.sendMessage(from, { react: { text: emoji, key: m.key } });
      break;
    }
  }
}


setInterval(async () => {
  const file = "./autoview.json";
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  if (!data.enabled) return;

  try {
    const statuses = await sock.fetchStatus();
    console.log("👁️ Auto viewing statuses...");
    if (statuses?.status?.length) {
      for (const s of statuses.status) {
        await sock.readMessages([{ remoteJid: s.jid, id: s.id }]);
      }
    }
  } catch (err) {
    console.error("❌ Failed to auto-view statuses:", err.message);
  }
}, 30000); // checks every 30 seconds



setInterval(async () => {
  const file = "./fakerecord.json";
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  if (!data.enabled) return;

  try {
    await sock.sendPresenceUpdate("recording");
    console.log("🎙 Bot showing fake recording...");
  } catch (err) {
    console.error("❌ Failed to send fake recording presence:", err.message);
  }
}, 15000); // updates every 15 seconds



    // 🚫 Auto-moderation starts here

  // 1️⃣ Bad word detection
  const sender = m.key.participant || m.key.remoteJid;

  const badWord = detectBadWords(text);
  if (badWord) {
    await sock.sendMessage(from, {
      text: `🚫 Please avoid using bad language. Word detected: *${badWord}*`
    });
    return;
  }

  // 2️⃣ Spam detection

  /*const spamCount = checkSpam(sender);
  if (spamCount > 5) {
    await sock.sendMessage(from, {
      text: "⚠️ You're sending messages too fast. Please slow down!"
    });
    return;
  }*/


    // 🧠 Auto replies
    const lower = text.toLowerCase();
    if (config.autoReplies[lower]) {
      await sock.sendMessage(from, {
        text: config.autoReplies[lower].replace(/TheBagBot/g, config.botName),
      });
      return;
    }

    // ⚙️ Command handler
    if (text.startsWith(config.prefix)) {
      const [cmdName, ...args] = text
        .slice(config.prefix.length)
        .trim()
        .split(/\s+/);
      const command = commands.get(cmdName.toLowerCase());

      if (command) {
        try {
          await command.execute(sock, m, args, config);
        } catch (err) {
          console.error("❌ Command error:", err);
          await sock.sendMessage(from, {
            text: "⚠️ Error executing command.",
          });
        }
      } else {
        await sock.sendMessage(from, {
          text: `❌ Unknown command. Try *${config.prefix}help* or *${config.prefix}ping*`,
        });
      }
    }
  });

  // 🕵️ Detect deleted messages
  sock.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      if (update.update.messageStubType === 91) {
        const deletedKey = update.key;
        const chat = deletedKey.remoteJid;
        const msgId = deletedKey.id;

        console.log(`🕵️ A message was deleted in ${chat}: ${msgId}`);

        if (config.ownerNumber) {
          await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
            text: `🕵️ Deleted message detected!\nChat: ${chat}\nMessage ID: ${msgId}`,
          });
        }
      }
    }
  });



setInterval(async () => {
  const file = "./autobio.json";
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  if (!data.enabled) return;

  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const date = new Date().toLocaleDateString("en-US");

  const newBio = `🤖 Active since ${date} | ⏰ ${time}`;
  try {
    await sock.updateProfileStatus(newBio);
    console.log("✅ Bio updated:", newBio);
  } catch (err) {
    console.error("❌ Failed to update bio:", err.message);
  }
}, 300000); // every 5 minutes

}




// 🕵️‍♂️ Anti-Delete Message Recovery
/*
sock.ev.on("messages.update", async (updates) => {
  const fs = await import("fs");
  const file = "./antidelete.json";
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
  const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");

  for (const update of updates) {
    if (update.update.messageStubType === 91) {
      const deletedKey = update.key;
      const chat = deletedKey.remoteJid;
      const msgId = deletedKey.id;

      if (data[chat]) {
        const deletedMsg = await sock.loadMessage(chat, msgId);
        if (deletedMsg?.message) {
          const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
          const text =
            deletedMsg.message.conversation ||
            deletedMsg.message.extendedTextMessage?.text ||
            "[Non-text message]";

          await sock.sendMessage(chat, {
            text: `🕵️‍♂️ *Anti-Delete Alert!*\n@${sender.split("@")[0]} deleted:\n\n${text}`,
            mentions: [sender],
          });
        }
      }
    }
  }
});

*/

// 🧠 Start bot
startBot();
