export default {
  name: "autobio",
  description: "Automatically updates your WhatsApp bio every few minutes.",
  async execute(sock, m, args) {
    const fs = await import("fs");
    const file = "./autobio.json";

    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
    const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");

    const user = sock.user.id.split(":")[0];
    const status = args[0]?.toLowerCase();

    if (status === "on") {
      data.enabled = true;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "🟢 *Auto Bio enabled!* Your bio will now update every few minutes.",
      });
    } else if (status === "off") {
      data.enabled = false;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(m.key.remoteJid, {
        text: "🔴 *Auto Bio disabled.* Your bio will remain static.",
      });
    } else {
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚙️ Usage: *.autobio on/off*",
      });
    }
  },
};
