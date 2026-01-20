import fs from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "menu",
  async execute(sock, m, args, config) {
    const chatId = m.key.remoteJid;

    // Read all command file names
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    const list = commandFiles
      .map(f => f.replace(".js", ""))
      .sort()
      .map(c => `${config.prefix}${c}`)
      .join("\n");

    const text = `
🤖 *${config.botName} Menu*
----------------------
${list}
----------------------
👑 Owner: ${config.ownerNumber}
    `.trim();

    await sock.sendMessage(chatId, { text });
  }
};
