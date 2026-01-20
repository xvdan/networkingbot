export default {
  name: "owner",
  description: "Show the bot owner's contact information",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;

      // 🧾 Owner details
      const ownerNumber = config.ownerNumber || "0000000000";
      const ownerJid = `${ownerNumber}@s.whatsapp.net`;
      const botName = config.botName || "MyBot";

      const message = `
👑 *${botName} Owner Info*

📞 *WhatsApp:* wa.me/${ownerNumber}
📢 *Channel:* ${config.channelLink || "N/A"}
💻 *GitHub:* ${config.githubLink || "N/A"}
🌐 *Website:* ${config.website || "N/A"}

💬 You can reach out to the owner for help, collaboration, or bot customization.
`;

      // 🧠 Create quick action buttons
      const buttons = [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "💬 Message Owner",
            url: `https://wa.me/${ownerNumber}`,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "📢 Open Channel",
            url: config.channelLink || "https://whatsapp.com",
          }),
        },
      ];

      await sock.sendMessage(from, {
        text: message,
        footer: `${botName} © 2025`,
        buttons,
      });

      console.log("✅ Owner info sent successfully.");
    } catch (error) {
      console.error("❌ Error in owner command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to fetch owner information. Try again later.",
      });
    }
  },
};
