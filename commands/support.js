export default {
  name: "support",
  description: "Send a message to the bot owner for help or feedback",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;
      const sender = m.key.participant || from;
      const text = args.join(" ");

      if (!text) {
        return await sock.sendMessage(from, {
          text: "💬 Please type your message. Example:\n\n.support I need help with the bot",
        });
      }

      // 📨 Send the message to owner
      const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;

      const supportMsg = `
📩 *Support Message Received*
━━━━━━━━━━━━━━━━━━
👤 From: ${sender}
💬 Message: ${text}
━━━━━━━━━━━━━━━━━━
`;

      await sock.sendMessage(ownerJid, { text: supportMsg });

      // ✅ Confirm to the user
      await sock.sendMessage(from, {
        text: "✅ Your message has been sent to the bot owner. You’ll get a reply soon.",
      });

      console.log(`📨 Support message from ${sender}: ${text}`);
    } catch (error) {
      console.error("❌ Error in support command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to send your support message. Please try again.",
      });
    }
  },
};
