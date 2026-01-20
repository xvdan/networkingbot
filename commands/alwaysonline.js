import fs from "fs";

const settingsFile = "./alwaysonline.json";

function loadSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
}

function saveSettings(data) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
}

export default {
  name: "alwaysonline",
  description: "Keep bot always showing online.",

  async execute(sock, m, args) {
    const chatId = m.key.remoteJid;
    const settings = loadSettings();

    const subCmd = args[0]?.toLowerCase();

    if (subCmd === "on") {
      settings.enabled = true;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "🌐 Always Online mode *enabled*." });
      return;
    }

    if (subCmd === "off") {
      settings.enabled = false;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "❌ Always Online mode *disabled*." });
      return;
    }

    await sock.sendMessage(chatId, {
      text: "Usage:\n.alwaysonline on – stay online forever\n.alwaysonline off – go back to normal",
    });
  },
};
