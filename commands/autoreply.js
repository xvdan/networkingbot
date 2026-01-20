export default {
  name: "autoreply",
  description: "Smart reply logic placeholder",
  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;
    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";
    const msg = text.toLowerCase().trim();

    if (config.autoReplies[msg]) {
      await sock.sendMessage(from, { text: config.autoReplies[msg] });
    }
  }
};
