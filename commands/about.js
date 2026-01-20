export default {
  name: "about",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;

    const uptimeMinutes = Math.round(process.uptime() / 60);
    const uptimeText =
      uptimeMinutes < 1
        ? `${Math.round(process.uptime())} seconds`
        : `${uptimeMinutes} minutes`;

    const caption = `
✨ *${config.botName} v${config.version}* ✨

🤖 A multipurpose WhatsApp bot powered by *Baileys*.

📢 *Channel:* ${config.channelLink}
💻 *GitHub:* ${config.githubLink}
💬 *Support Group:* ${config.supportGroup}

👑 *Owner:* ${config.ownerName}
📱 *Contact:* wa.me/${config.ownerNumber}

⚙️ *Prefix:* ${config.prefix}
🕒 *Uptime:* ${uptimeText}

🌐 Follow for updates & tutorials!
    `.trim();

    const buttons = [
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "📺 Visit Channel",
          url: config.channelLink,
        }),
      },
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "💻 GitHub Repo",
          url: config.githubLink,
        }),
      },
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "💬 Join Support Group",
          url: config.supportGroup,
        }),
      },
    ];

    await sock.sendMessage(chatId, {
      text: caption,
      footer: `🤖 ${config.botName} — Created by ${config.ownerName}`,
      templateButtons: buttons,
    });
  },
};
