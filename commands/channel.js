export default {
  name: "channel",
  description: "Send the bot's official channel and links",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;

      // ✅ Channel Info (edit these)
      const channelName = config.botName || "My WhatsApp Bot";
      const channelLink = config.channelLink || "https://whatsapp.com/channel/your-channel-id";
      const github = config.githubLink || "https://github.com/yourusername";
      const website = config.website || "https://yourwebsite.com";
      const message = `
🎉 *${channelName} Official Links*

📢 *WhatsApp Channel:* Stay updated with our latest news.
💻 *GitHub Repo:* ${github}
🌐 *Website:* ${website}

💬 Follow & share to support development!
`;

      // 🪄 Send button message
      const buttons = [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "📢 Open Channel",
            url: channelLink,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "💻 Visit GitHub",
            url: github,
          }),
        },
      ];

      await sock.sendMessage(from, {
        text: message,
        footer: "TheBagBot © 2025 | Stay connected 💚",
        buttons,
      });

      console.log("✅ Channel info sent successfully.");
    } catch (error) {
      console.error("❌ Error in channel command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to send channel info. Try again later.",
      });
    }
  },
};
