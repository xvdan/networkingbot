export default {
  name: "ping",
  description: "Check if the bot is alive",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    const start = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pinging..." });
    const latency = Date.now() - start;
    await sock.sendMessage(from, { text: `✅ Pong! ${latency}ms response time.` });
  },
};
