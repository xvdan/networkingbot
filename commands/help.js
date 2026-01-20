import fs from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "help",
  description: "Show all available commands",
  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;
    const commandsPath = path.join(__dirname);
    const files = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

    let helpText = `🤖 *${config.botName}* Command List\n\n`;
    helpText += `Prefix: *${config.prefix}*\n\n`;

    for (const file of files) {
      const { default: cmd } = await import(`./${file}`);
      if (cmd?.name && cmd?.description) {
        helpText += `🔹 *${config.prefix}${cmd.name}* — ${cmd.description}\n`;
      }
    }

    helpText += `\n🧠 Total Commands: ${files.length}`;
    helpText += `\n💡 Tip: You can add your own commands inside the *commands/* folder!`;

    await sock.sendMessage(from, { text: helpText });
  },
};
