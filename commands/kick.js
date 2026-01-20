export default {
  name: "kick",
  description: "Kick mentioned user from group",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;

    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ This command is only for groups." });
      return;
    }

    const sender = m.key.participant || m.key.remoteJid;
    if (!sender.includes(config.ownerNumber)) {
      await sock.sendMessage(chatId, { text: "🚫 Only owner can use this." });
      return;
    }

    if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      await sock.sendMessage(chatId, { text: "📌 Tag the user to kick: .kick @user" });
      return;
    }

    const users = m.message.extendedTextMessage.contextInfo.mentionedJid;

    try {
      await sock.groupParticipantsUpdate(chatId, users, "remove");
      await sock.sendMessage(chatId, { text: "✅ User removed from group." });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(chatId, { text: "❌ Failed to remove user. Is bot admin?" });
    }
  }
};
