import fs from "fs";

const customReactFile = "./customReacts.json";

function loadCustomReacts() {
  try {
    if (!fs.existsSync(customReactFile)) return {};
    const content = fs.readFileSync(customReactFile, "utf8").trim();
    if (!content) return {};
    return JSON.parse(content);
  } catch {
    console.log("⚠️ customReacts.json invalid, resetting...");
    return {};
  }
}

function saveCustomReacts(data) {
  fs.writeFileSync(customReactFile, JSON.stringify(data, null, 2));
}

export default {
  name: "setreact",
  description: "Add, delete, or list custom word → emoji reactions (admin only)",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 🧩 Skip private chats
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "❌ This command works only in groups." });
      return;
    }

    // 🛡 Verify admin
    const groupMetadata = await sock.groupMetadata(chatId);
    const isAdmin = groupMetadata.participants.some(
      (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!isAdmin && sender !== `${config.ownerNumber}@s.whatsapp.net`) {
      await sock.sendMessage(chatId, {
        text: "🚫 Only group admins can use this command.",
      });
      return;
    }

    // Load current reactions
    const reacts = loadCustomReacts();
    const command = args[0]?.toLowerCase();

    if (!command || !["add", "del", "list"].includes(command)) {
      await sock.sendMessage(chatId, {
        text: `Usage:
• *.setreact add [word] [emoji]* → Add new reaction
• *.setreact del [word]* → Delete reaction
• *.setreact list* → Show all reactions`,
      });
      return;
    }

    // 📜 List reactions
    if (command === "list") {
      const groupReacts = reacts[chatId] || {};
      if (Object.keys(groupReacts).length === 0) {
        await sock.sendMessage(chatId, { text: "⚠️ No custom reactions set yet." });
      } else {
        const list = Object.entries(groupReacts)
          .map(([word, emoji]) => `• ${word} → ${emoji}`)
          .join("\n");
        await sock.sendMessage(chatId, {
          text: `📋 Custom Reactions:\n${list}`,
        });
      }
      return;
    }

    // ➕ Add reaction
    if (command === "add") {
      const word = args[1]?.toLowerCase();
      const emoji = args[2];
      if (!word || !emoji) {
        await sock.sendMessage(chatId, {
          text: "Usage: *.setreact add [word] [emoji]*",
        });
        return;
      }

      if (!reacts[chatId]) reacts[chatId] = {};
      reacts[chatId][word] = emoji;
      saveCustomReacts(reacts);
      await sock.sendMessage(chatId, {
        text: `✅ Added reaction:\n"${word}" → ${emoji}`,
      });
      return;
    }

    // ❌ Delete reaction
    if (command === "del") {
      const word = args[1]?.toLowerCase();
      if (!word) {
        await sock.sendMessage(chatId, {
          text: "Usage: *.setreact del [word]*",
        });
        return;
      }

      if (reacts[chatId]?.[word]) {
        delete reacts[chatId][word];
        saveCustomReacts(reacts);
        await sock.sendMessage(chatId, {
          text: `🗑 Deleted reaction for "${word}".`,
        });
      } else {
        await sock.sendMessage(chatId, {
          text: `⚠️ No reaction found for "${word}".`,
        });
      }
    }
  },
};
