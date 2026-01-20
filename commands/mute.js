export default {
  name: "mute",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    if (!sender.includes(config.ownerNumber)) {
      await sock.sendMessage(chatId, { text: "🚫 Only owner can mute group." });
      return;
    }

    try {
      await sock.groupSettingUpdate(chatId, "announcement");
      await sock.sendMessage(chatId, { text: "🔇 Group muted for non-admins." });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(chatId, { text: "❌ Failed to mute. Is bot admin?" });
    }
  }
};
