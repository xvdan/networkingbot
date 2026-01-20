export default {
  name: "demote",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    if (!chatId.endsWith("@g.us")) return;

    const sender = m.key.participant || m.key.remoteJid;
    if (!sender.includes(config.ownerNumber)) {
      await sock.sendMessage(chatId, { text: "🚫 Only owner can use this." });
      return;
    }

    const users = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!users?.length) {
      await sock.sendMessage(chatId, { text: "📌 Tag user to demote: .demote @user" });
      return;
    }

    await sock.groupParticipantsUpdate(chatId, users, "demote");
    await sock.sendMessage(chatId, { text: "✅ User demoted from admin!" });
  }
};
