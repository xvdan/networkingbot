import fs from "fs";

export default {
  name: "leave",
  description: "Make the bot leave the current group (Owner Only).",
  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;

      // ✅ Make sure command is used in a group
      if (!from.endsWith("@g.us")) {
        await sock.sendMessage(from, {
          text: "⚠️ This command only works inside a group chat.",
        });
        return;
      }

      // ✅ Get sender (the one who sent the message)
      const sender = m.key.participant || m.participant || m.key.remoteJid;
      const senderNumber = sender.split("@")[0];

      // ✅ Get owner number from config
      const ownerNumber = config.ownerNumber.replace(/[^0-9]/g, "");

      // 🔒 Only owner can use this command
      if (senderNumber !== ownerNumber) {
        await sock.sendMessage(from, {
          text: "🚫 You are *not authorized* to make the bot leave this group.",
        });
        return;
      }

      // ✅ Fetch group name for a polite exit
      const metadata = await sock.groupMetadata(from);
      const groupName = metadata.subject;

      await sock.sendMessage(from, {
        text: `👋 Leaving *${groupName}* on owner’s command...`,
      });

      // 🚪 Leave group
      await sock.groupLeave(from);
      console.log(`🚪 Bot left group: ${groupName} (${from})`);

    } catch (err) {
      console.error("❌ Error in .leave command:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to leave the group. Please try again.",
      });
    }
  },
};
