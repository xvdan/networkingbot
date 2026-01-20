import axios from "axios";

export default {
  name: "video",
  description: "Download videos from YouTube, Instagram, or Facebook",
  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;
    const link = args[0];

    if (!link) {
      await sock.sendMessage(from, { text: "❌ Please provide a video link.\nExample: *.video https://youtu.be/xyz*" });
      return;
    }

    // 🧠 Identify platform
    let platform;
    if (link.includes("youtube.com") || link.includes("youtu.be")) platform = "YouTube";
    else if (link.includes("instagram.com")) platform = "Instagram";
    else if (link.includes("facebook.com")) platform = "Facebook";
    else {
      await sock.sendMessage(from, { text: "⚠️ Unsupported link. Try a YouTube, Instagram, or Facebook URL." });
      return;
    }

    await sock.sendMessage(from, { text: `⏳ Downloading from *${platform}*... please wait.` });

    try {
      // 🌐 Use a public API to fetch video data
      const apiUrl = `https://api.akuari.my.id/downloader/${platform.toLowerCase()}?link=${encodeURIComponent(link)}`;
      const res = await axios.get(apiUrl);
      const result = res.data;

      // Handle missing results
      if (!result || !result.url) {
        await sock.sendMessage(from, { text: "❌ Failed to fetch video link. Try another URL." });
        return;
      }

      // 🎥 Send the video file to user
      await sock.sendMessage(from, {
        video: { url: result.url },
        caption: `✅ Downloaded from *${platform}* by ${config.botName}`,
      });
    } catch (err) {
      console.error("❌ Video download error:", err.message);
      await sock.sendMessage(from, { text: "⚠️ Error downloading video. Try again later." });
    }
  },
};
