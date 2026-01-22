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
import { detectBadWords } from "./modules/automod.js";
import antilinkData from "./antilink.json" assert { type: "json" };

// 🧭 Paths
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ Config
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const logger = pino({ level: "silent" });

// 🧩 Load commands
const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;
  const { default: command } = await import(`./commands/${file}`);
  if (command?.name && typeof command.execute === "function") {
    commands.set(command.name, command);
    console.log(`✅ Loaded command: ${command.name}`);
  }
}

// 🧠 JSON loader
const loadJSON = (file, fallback = {}) => {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8") || "{}");
};

// 🚀 Start Bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: [config.botName || "NetworkingBot", "Chrome", "1.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // 🌐 Connection
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 Scan QR Code:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log(`✅ ${config.botName} connected`);
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        fs.rmSync("auth_info", { recursive: true, force: true });
      }
      startBot();
    }
  });

  // ⏱️ INTERVAL FEATURES (ONCE)
  setInterval(async () => {
    const alwaysOnline = loadJSON("./alwaysonline.json");
    if (alwaysOnline.enabled) {
      await sock.sendPresenceUpdate("available").catch(() => {});
    }
  }, 10000);

  setInterval(async () => {
    const autoview = loadJSON("./autoview.json");
    if (!autoview.enabled) return;
    try {
      const statuses = await sock.fetchStatus();
      for (const s of statuses?.status || []) {
        await sock.readMessages([{ remoteJid: s.jid, id: s.id }]);
      }
    } catch {}
  }, 30000);

  setInterval(async () => {
    const fakerecord = loadJSON("./fakerecord.json");
    if (fakerecord.enabled) {
      await sock.sendPresenceUpdate("recording").catch(() => {});
    }
  }, 15000);

  setInterval(async () => {
    const autobio = loadJSON("./autobio.json");
    if (!autobio.enabled) return;

    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const date = new Date().toLocaleDateString("en-US");

    await sock
      .updateProfileStatus(`🤖 Active since ${date} | ⏰ ${time}`)
      .catch(() => {});
  }, 300000);

  // 💬 Messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const isGroup = from.endsWith("@g.us");

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      "";

    if (!text) return;
    console.log("💬", text);

    // 🔵 Auto Blue
    const autoBlue = loadJSON("./autoblue.json");
    if (autoBlue.enabled) {
      await sock.readMessages([m.key]).catch(() => {});
    }

    // ✍️ Fake typing
    const fakeTyping = loadJSON("./faketyping.json");
    if (fakeTyping[from]) {
      await sock.sendPresenceUpdate("composing", from);
      await new Promise((r) => setTimeout(r, 3000));
      await sock.sendPresenceUpdate("paused", from);
    }

    // 🚫 Bad words
    const badWord = detectBadWords(text);
    if (badWord) {
      await sock.sendMessage(from, {
        text: `🚫 Please avoid bad language (*${badWord}*)`,
      });
      return;
    }

    // 🔗 Anti-link
    if (isGroup && antilinkData.enabledGroups.includes(from)) {
      const meta = await sock.groupMetadata(from).catch(() => null);
      const isAdmin = meta?.participants.some(
        (p) =>
          p.id === sender &&
          (p.admin === "admin" || p.admin === "superadmin")
      );

      if (/(https?:\/\/[^\s]+)/gi.test(text) && !isAdmin) {
        await sock.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: m.key.id,
            participant: sender,
          },
        });
        return;
      }
    }

    // 🫶 Auto React
    const autoreact = loadJSON("./autoreact.json");
    if (autoreact[from]) {
      const reactions = {
        hello: "👋",
        lol: "😂",
        thanks: "🙏",
        love: "❤️",
        morning: "☀️",
        night: "🌙",
      };
      for (const k in reactions) {
        if (text.toLowerCase().includes(k)) {
          await sock.sendMessage(from, {
            react: { text: reactions[k], key: m.key },
          });
          break;
        }
      }
    }

    // 🧠 AUTO-REPLY (CONTROLLED)
    const autoReplySettings = loadJSON("./autoreply.settings.json", {
      enabled: true,
      disableInGroups: false,
      disabledUsers: [],
      enabledUsers: [],
    });

    const canAutoReply =
      autoReplySettings.enabled &&
      (!isGroup || !autoReplySettings.disableInGroups) &&
      !autoReplySettings.disabledUsers.includes(sender) &&
      (autoReplySettings.enabledUsers.length === 0 ||
        autoReplySettings.enabledUsers.includes(sender));

    if (canAutoReply) {
      const reply = config.autoReplies?.[text.toLowerCase()];
      if (reply) {
        await sock.sendMessage(from, {
          text: reply.replace(/TheBagBot/g, config.botName),
        });
        return;
      }
    }

    // ⚙️ Commands
    if (text.startsWith(config.prefix)) {
      const [cmd, ...args] = text
        .slice(config.prefix.length)
        .trim()
        .split(/\s+/);
      const command = commands.get(cmd.toLowerCase());
      if (command) {
        await command.execute(sock, m, args, config).catch(() => {
          sock.sendMessage(from, { text: "⚠️ Command error" });
        });
      }
    }
  });

  // 🕵️ Deleted message notify
  sock.ev.on("messages.update", async (updates) => {
    for (const u of updates) {
      if (u.update.messageStubType === 91 && config.ownerNumber) {
        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: `🕵️ Message deleted in ${u.key.remoteJid}`,
        });
      }
    }
  });
}

startBot();
