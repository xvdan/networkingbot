import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

export default {
  name: "sticker",
  async execute(sock, m) {
    const chatId = m.key.remoteJid;

    // DEBUG: uncomment to inspect message structure if something fails
    // console.log(JSON.stringify(m, null, 2));

    // 1) Check if this command was used as a reply to a message that has image
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = quoted?.imageMessage || m.message?.imageMessage;

    if (!imageMessage) {
      await sock.sendMessage(chatId, {
        text: "📌 Reply to an *image* with .sticker"
      });
      return;
    }

    try {
      // 2) Download the image as a stream and convert to Buffer
      const stream = await downloadContentFromMessage(imageMessage, "image");
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 3) Create sticker
      const sticker = new Sticker(buffer, {
        pack: "My Bot",
        author: "You",
        type: StickerTypes.FULL,
        quality: 70
      });
      const stickerBuffer = await sticker.toBuffer();

      // 4) Send sticker
      await sock.sendMessage(chatId, { sticker: stickerBuffer });

    } catch (err) {
      console.error("❌ Sticker Error:", err);
      // If it's a timeout or send failure, show a helpful message to owner
      await sock.sendMessage(chatId, {
        text: "⚠️ Could not create/send sticker. I've logged the error."
      });
    }
  }
};
