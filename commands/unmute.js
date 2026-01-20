export default {
  name: "unmute",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    if (!sender.includes(config.ownerNumber)) {
      await sock.sendMessage(chatId, { text: "🚫 Only owner can unmute group." });
      return;
    }

    try {
      await sock.groupSettingUpdate(chatId, "not_announcement");
      await sock.sendMessage(chatId, { text: "🔊 Group unmuted! Everyone can chat again." });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(chatId, { text: "❌ Failed to unmute. Is bot admin?" });
    }
  }
};
