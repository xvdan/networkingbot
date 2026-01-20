export default {
  name: "vv",
  description: "Reveal and resend view-once media (image/video).",
  async execute(sock, m, args) {
    try {
      // Ensure message is replying to something
      if (!m.message?.extendedTextMessage?.contextInfo?.stanzaId) {
        await sock.sendMessage(m.key.remoteJid, {
          text: "📌 Reply to a *view-once* image or video using *.vv*",
        });
        return;
      }

      // Get replied message
      const quoted = m.message.extendedTextMessage.contextInfo;
      const msg = await sock.loadMessage(quoted.stanzaId, quoted.participant, quoted.remoteJid);

      if (!msg?.message) {
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Could not find the message." });
        return;
      }

      const msgType = Object.keys(msg.message)[0];
      if (msgType !== "viewOnceMessageV2") {
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ That message is not view-once media." });
        return;
      }

      // Extract actual media inside
      const mediaMsg = msg.message.viewOnceMessageV2.message;
      const type = Object.keys(mediaMsg)[0];

      const stream = await sock.downloadMediaMessage(
        { message: mediaMsg },
        "buffer"
      );

      // Resend it as normal media
      if (type === "imageMessage") {
        await sock.sendMessage(m.key.remoteJid, {
          image: stream,
          caption: "📸 Revealed View-Once Image",
        });
      } else if (type === "videoMessage") {
        await sock.sendMessage(m.key.remoteJid, {
          video: stream,
          caption: "🎥 Revealed View-Once Video",
        });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Unsupported media type." });
      }

    } catch (err) {
      console.error("❌ Error revealing view-once:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Failed to reveal view-once media.",
      });
    }
  },
};
