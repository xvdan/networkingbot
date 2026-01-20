import os from "os";

export default {
  name: "info",
  description: "Show bot and system information",

  async execute(sock, m, args, config) {
    try {
      const from = m.key.remoteJid;

      // 🕒 Calculate uptime
      const uptimeSeconds = process.uptime();
      const uptime =
        `${Math.floor(uptimeSeconds / 3600)}h ` +
        `${Math.floor((uptimeSeconds % 3600) / 60)}m ` +
        `${Math.floor(uptimeSeconds % 60)}s`;

      // ⚙️ System Info
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const cpuModel = os.cpus()[0].model;
      const platform = os.platform();

      // 📊 Command count
      const commandCount = config.commandCount || "N/A";

      // 📬 Owner
      const owner = config.ownerNumber ? `${config.ownerNumber}@s.whatsapp.net` : "N/A";

      const infoMessage = `
🤖 *${config.botName} Information*

🧠 *Bot Name:* ${config.botName}
⚙️ *Version:* 1.0.0
👑 *Owner:* ${owner}
🧩 *Commands Loaded:* ${commandCount}

🕒 *Uptime:* ${uptime}
💻 *Platform:* ${platform}
🧠 *CPU:* ${cpuModel}
💾 *Memory:* ${freeMem} GB Free / ${totalMem} GB Total

📢 *Channel:* ${config.channelLink || "N/A"}
💻 *GitHub:* ${config.githubLink || "N/A"}

✨ Bot running smoothly and ready to serve!
`;

      await sock.sendMessage(from, { text: infoMessage });
      console.log("✅ Info command executed successfully.");
    } catch (error) {
      console.error("❌ Error in info command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to fetch info. Try again later.",
      });
    }
  },
};
