export default {
  name: "autoview",
  description: "Automatically view all new WhatsApp statuses.",
  async execute(sock, m, args) {
    const fs = await import("fs");
    const file = "./autoview.json";

    // Create file if not present
    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");

    const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
    const option = args[0]?.toLowerCase();

    if (option === "on") {
      data.enabled = true;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "👁️ *Auto View mode activated!* The bot will now view all new statuses automatically.",
      });
    } else if (option === "off") {
      data.enabled = false;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "✋ *Auto View mode deactivated.*",
      });
    } else {
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚙️ Usage: *.autoview on/off*",
      });
    }
  },
};
