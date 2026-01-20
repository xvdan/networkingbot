import fs from "fs";
import pkg from "google-tts-api";
const { getAudioUrl } = pkg;

export default {
  name: "sayas",
  description: "Convert text to voice and send as audio",
  async execute(sock, m, args, config) {
    try {
      const text = args.join(" ");
      if (!text) {
        await sock.sendMessage(m.key.remoteJid, {
          text: "🗣️ Usage: .sayas <text>",
        });
        return;
      }

      // Generate Google TTS URL
      const url = getAudioUrl(text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
      });

      // Fetch and convert to buffer
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Send as voice note
      await sock.sendMessage(m.key.remoteJid, {
        audio: audioBuffer,
        mimetype: "audio/mp4",
        ptt: true,
      });

      console.log(`🗣️ Sent fake voice for text: ${text}`);
    } catch (err) {
      console.error("❌ Error generating fake voice:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to generate voice.",
      });
    }
  },
};
