export default {
  name: "antidelete",
  description: "Toggle anti-delete feature for the group.",
  async execute(sock, m, args) {
    const fs = await import("fs");
    const file = "./antidelete.json";

    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
    const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");

    const group = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = group.endsWith("@g.us");

    if (!isGroup) {
      await sock.sendMessage(group, { text: "❌ This command only works in groups." });
      return;
    }

    const status = args[0]?.toLowerCase();

    if (status === "on") {
      data[group] = true;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(group, { text: "🛡️ Anti-Delete is now *enabled* for this group!" });
    } else if (status === "off") {
      data[group] = false;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      await sock.sendMessage(group, { text: "🚫 Anti-Delete has been *disabled* for this group." });
    } else {
      await sock.sendMessage(group, { text: "⚙️ Usage: *.antidelete on/off*" });
    }
  },
};
