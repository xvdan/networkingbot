import fs from "fs";

const settingsFile = "./autoreact.json";

function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) return {};
    const data = fs.readFileSync(settingsFile, "utf8").trim();
    return data ? JSON.parse(data) : {};
  } catch {
    console.log("⚠️ autoreact.json invalid. Resetting...");
    return {};
  }
}

function saveSettings(data) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
}

export default {
  name: "autoreact",
  description: "Enable or disable auto reaction feature per group",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 🧩 Skip private chats
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "❌ This command works only in groups." });
      return;
    }

    // 🛡 Verify admin
    const metadata = await sock.groupMetadata(chatId);
    const isAdmin = metadata.participants.some(
      (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!isAdmin && sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      await sock.sendMessage(chatId, {
        text: "🚫 Only group admins can use this command.",
      });
      return;
    }

    // ⚙️ Toggle setting
    const settings = loadSettings();
    const state = args[0]?.toLowerCase();

    if (!state || !["on", "off"].includes(state)) {
      const status = settings[chatId] ? "✅ ON" : "❌ OFF";
      await sock.sendMessage(chatId, {
        text: `📡 Auto React is currently *${status}*\nUse *.autoreact on* or *.autoreact off*`,
      });
      return;
    }

    if (state === "on") {
      settings[chatId] = true;
      await sock.sendMessage(chatId, { text: "✅ Auto React is now *ON* for this group." });
    } else {
      delete settings[chatId];
      await sock.sendMessage(chatId, { text: "🚫 Auto React has been turned *OFF*." });
    }

    saveSettings(settings);
  },
};
