export default {
  name: "invite",
  description: "Generate and share the group invite link",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;

      // ✅ Check if command is used in a group
      if (!from.endsWith("@g.us")) {
        return await sock.sendMessage(from, {
          text: "⚠️ This command only works in groups!",
        });
      }

      // 🔎 Get group metadata
      const groupMetadata = await sock.groupMetadata(from);
      const groupName = groupMetadata.subject;

      // 🛠️ Try to get invite link
      const inviteCode = await sock.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      // 🧠 Format message
      const message = `
🔗 *Group Invite for:* ${groupName}

📎 *Link:* ${inviteLink}

🧠 Use this link to join the group.
`;

      await sock.sendMessage(from, { text: message });
    } catch (error) {
      console.error("❌ Error in invite command:", error);

      // ⚠️ Handle permission issue
      if (String(error).includes("403")) {
        await sock.sendMessage(m.key.remoteJid, {
          text: "⚠️ I need *admin privileges* to generate the invite link!",
        });
      } else {
        await sock.sendMessage(m.key.remoteJid, {
          text: "❌ Failed to get invite link. Try again later.",
        });
      }
    }
  },
};
