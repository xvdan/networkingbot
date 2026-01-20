import fs from "fs";
import data from "../antilink.json" assert { type: "json" };

export default {
  name: "antilink",
  description: "Toggle anti-link system in group",

  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;
    const groupMetadata = await sock.groupMetadata(from).catch(() => null);
    if (!groupMetadata)
      return await sock.sendMessage(from, { text: "❌ This command only works in groups." });

    const sender = m.key.participant;
    const isAdmin = groupMetadata.participants.some(
      (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!isAdmin)
      return await sock.sendMessage(from, { text: "❌ Only admins can toggle Anti-Link." });

    const current = data.enabledGroups.includes(from);
    if (current) {
      data.enabledGroups = data.enabledGroups.filter((id) => id !== from);
      await sock.sendMessage(from, { text: "🚫 Anti-Link disabled in this group." });
    } else {
      data.enabledGroups.push(from);
      await sock.sendMessage(from, { text: "✅ Anti-Link enabled in this group." });
    }

    fs.writeFileSync("./antilink.json", JSON.stringify(data, null, 2));
  },
};
