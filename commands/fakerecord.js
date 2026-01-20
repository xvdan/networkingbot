export default {
  name: "fakerecord",
  description: "Simulate voice recording (shows 'recording audio...')",
  async execute(sock, m, args) {
    const fs = await import("fs");
    const file = "./fakerecord.json";

    // Create file if missing
    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");

    const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
    const status = args[0]?.toLowerCase();

    if (status === "on") {
      data.enabled = true;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "🎙️ *Fake Recording mode activated!* The bot will appear as recording audio.",
      });
    } else if (status === "off") {
      data.enabled = false;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "🔇 *Fake Recording mode deactivated.*",
      });
    } else {
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚙️ Usage: *.fakerecord on/off*",
      });
    }
  },
};
