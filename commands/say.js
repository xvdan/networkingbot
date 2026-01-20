export default {
  name: "say",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const text = args.join(" ");

    if (!text) {
      await sock.sendMessage(chatId, { text: "📣 Usage: .say Hello world!" });
      return;
    }

    await sock.sendMessage(chatId, { text });
  }
};
