export default {
  name: "broadcast",
  description: "Send a broadcast message to all group chats",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      // ✅ Check if sender is owner
      if (!sender.includes(config.ownerNumber)) {
        await sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." });
        return;
      }

      const message = args.join(" ");
      if (!message)
        return await sock.sendMessage(from, { text: "📝 Usage: *.broadcast [message]*" });

      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);

      if (groupIds.length === 0)
        return await sock.sendMessage(from, { text: "⚠️ No groups found to broadcast." });

      await sock.sendMessage(from, {
        text: `📣 Broadcasting message to *${groupIds.length} groups*...`,
      });

      let sentCount = 0;
      for (const id of groupIds) {
        await sock.sendMessage(id, {
          text: `📢 *${config.botName} Broadcast:*\n\n${message}`,
        });
        sentCount++;
        await new Promise((res) => setTimeout(res, 1000)); // Small delay
      }

      await sock.sendMessage(from, {
        text: `✅ Broadcast completed! Sent to ${sentCount} groups.`,
      });

      console.log(`📢 Broadcast finished — sent to ${sentCount} groups.`);
    } catch (error) {
      console.error("❌ Error during broadcast:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Broadcast failed. Please check logs.",
      });
    }
  },
};
