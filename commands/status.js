import os from "os";
import process from "process";
import { performance } from "perf_hooks";
import { fetchLatestBaileysVersion } from "@whiskeysockets/baileys";

export default {
  name: "status",
  description: "Show bot system info and stats",

  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;

    // 🕒 Uptime calculation
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    // ⚡ Ping test
    const start = performance.now();
    await sock.sendPresenceUpdate("composing", from);
    const end = performance.now();
    const ping = (end - start).toFixed(2);

    // 💻 System info
    const { version } = await fetchLatestBaileysVersion();
    const platform = os.platform();
    const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    // 🧠 Build the status message
    const statusMsg = `
🌐 *${config.botName} Status Panel*
──────────────────────────
🕒 *Uptime:* ${uptimeString}
⚡ *Ping:* ${ping} ms
💻 *Platform:* ${platform}
🧩 *Baileys Version:* ${version.join(".")}
📦 *RAM Usage:* ${ramUsage} MB
🤖 *Mode:* ${config.mode || "Public"}
👑 *Owner:* ${config.ownerNumber}
──────────────────────────
🔗 *GitHub:* ${config.github || "N/A"}
📢 *Channel:* ${config.channel || "N/A"}
    `.trim();

    await sock.sendMessage(from, { text: statusMsg });
  },
};
