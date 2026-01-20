export default {
  name: "time",
  async execute(sock, m) {
    const chatId = m.key.remoteJid;
    const time = new Date().toLocaleTimeString();

    await sock.sendMessage(chatId, {
      text: `⏰ Current time: ${time}`
    });
  }
};
