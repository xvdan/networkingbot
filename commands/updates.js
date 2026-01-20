export default {
  name: "updates",
  description: "Send a broadcast message to all chats (owner only)",

  async execute(sock, m, args, config) {
    try {
      const sender = m.key.participant || m.key.remoteJid;
      const from = m.key.remoteJid;
      const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;

      // 🧱 Owner-only restriction
      if (sender !== ownerJid && from !== ownerJid) {
        return await sock.sendMessage(from, {
          text: "⚠️ Only the bot owner can use this command!",
        });
      }

      const message = args.join(" ");
      if (!message) {
        return await sock.sendMessage(from, {
          text: "📝 Please type a message to broadcast.\n\nExample:\n.updates New feature added!",
        });
      }

      // 🔍 Fetch all chats
      const chats = Object.keys(await sock.chats);
      if (chats.length === 0) {
        return await sock.sendMessage(from, { text: "❌ No chats found to broadcast." });
      }

      // 🚀 Send to each chat
      let successCount = 0;
      for (const chatId of chats) {
        try {
          await sock.sendMessage(chatId, {
            text: `📢 *${config.botName} Update*\n\n${message}\n\n🔗 Join our channel: ${config.channelLink || "N/A"}`,
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${chatId}:`, err.message);
        }
      }

      // ✅ Report summary
      await sock.sendMessage(from, {
        text: `✅ Broadcast sent to ${successCount} chats.`,
      });

      console.log(`📢 Broadcast complete: ${successCount} chats`);
    } catch (error) {
      console.error("❌ Error in updates command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to send broadcast. Try again later.",
      });
    }
  },
};
