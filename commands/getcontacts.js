import fs from "fs";
import path from "path";

/**
 * Safe send wrapper — waits and retries until Baileys has a valid session.
 */
async function safeSend(sock, jid, content, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await sock.sendMessage(jid, content);
      return true;
    } catch (err) {
      if (err.message.includes("No sessions")) {
        console.log(`⚠️ No session yet for ${jid}. Retrying (${i + 1}/${retries})...`);
        await new Promise((r) => setTimeout(r, 2500)); // wait 2.5s before retry
      } else {
        throw err; // other errors → throw directly
      }
    }
  }
  throw new Error("Failed to send after retries (no session)");
}

export default {
  name: "getcontacts",
  description: "Exports all group contacts to a .vcf file",

  async execute(sock, msg) {
    try {
      const jid = msg.key.remoteJid;

      if (!jid.endsWith("@g.us")) {
        await safeSend(sock, jid, { text: "⚠️ This command works only in groups." });
        return;
      }

      const groupMetadata = await sock.groupMetadata(jid);
      const participants = groupMetadata.participants || [];

      if (participants.length === 0) {
        await safeSend(sock, jid, { text: "⚠️ No members found in this group." });
        return;
      }

      let vcfData = "";
      for (const p of participants) {
        const number = p.id.split("@")[0];
        vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${number}\nTEL;TYPE=CELL:+${number}\nEND:VCARD\n`;
      }

      const filePath = path.join(process.cwd(), "group_contacts.vcf");
      fs.writeFileSync(filePath, vcfData);

      // Wait briefly before sending file
      await new Promise((r) => setTimeout(r, 2000));

      await safeSend(sock, jid, {
        document: fs.readFileSync(filePath),
        mimetype: "text/vcard",
        fileName: "group_contacts.vcf",
        caption: "📇 All group contacts exported successfully!",
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Error exporting contacts:", err);
      try {
        await safeSend(sock, msg.key.remoteJid, {
          text: "⚠️ Error exporting group contacts. Try again after the bot has fully synced.",
        });
      } catch {
        // ignore if still fails
      }
    }
  },
};
