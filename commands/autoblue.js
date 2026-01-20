import fs from "fs";

const settingsFile = "./autoblue.json";

function loadSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
}

function saveSettings(data) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
}

export default {
  name: "autoblue",
  description: "Automatically mark all messages as read.",

  async execute(sock, m, args) {
    const chatId = m.key.remoteJid;
    const settings = loadSettings();

    const subCmd = args[0]?.toLowerCase();

    if (subCmd === "on") {
      settings.enabled = true;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "✅ Auto Blue Ticks *enabled*." });
      return;
    }

    if (subCmd === "off") {
      settings.enabled = false;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "❌ Auto Blue Ticks *disabled*." });
      return;
    }

    await sock.sendMessage(chatId, {
      text: "Usage:\n.autoblue on – mark all chats as read automatically\n.autoblue off – disable auto-read",
    });
  },
};
