import fs from "fs";

const settingsFile = "./faketyping.json";

function loadSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
}

function saveSettings(data) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
}

export default {
  name: "faketyping",
  description: "Toggle fake typing on/off for chats.",

  async execute(sock, m, args) {
    const chatId = m.key.remoteJid;
    const settings = loadSettings();

    const subCmd = args[0]?.toLowerCase();

    if (subCmd === "on") {
      settings[chatId] = true;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "✅ Fake typing *enabled* for this chat." });
      return;
    }

    if (subCmd === "off") {
      settings[chatId] = false;
      saveSettings(settings);
      await sock.sendMessage(chatId, { text: "❌ Fake typing *disabled* for this chat." });
      return;
    }

    await sock.sendMessage(chatId, {
      text: "Usage:\n.faketyping on – enable fake typing\n.faketyping off – disable fake typing",
    });
  },
};
