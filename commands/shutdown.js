export default {
  name: "shutdown",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // Check if the sender is the owner
    if (!sender.includes(config.ownerNumber)) {
      await sock.sendMessage(chatId, { text: "🚫 Only the owner can use this command." });
      return;
    }

    await sock.sendMessage(chatId, { text: "👋 Bot shutting down..." });
    process.exit(0);
  }
};
