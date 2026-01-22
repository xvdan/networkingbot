import fs from "fs";
import stringSimilarity from "string-similarity";
import natural from "natural";

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
let modelBuilt = false;

function buildModel(autoReplies) {
  if (modelBuilt) return;
  for (const intent in autoReplies) {
    const examples = autoReplies[intent].examples || [];
    examples.forEach(e =>
      tfidf.addDocument(e.toLowerCase(), intent)
    );
  }
  modelBuilt = true;
}

function canAutoReply(m) {
  const settings = JSON.parse(
    fs.readFileSync("./autoreply.settings.json", "utf8")
  );

  if (!settings.enabled) return false;

  const jid = m.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");
  const sender = m.key.participant || jid;

  if (isGroup && !settings.allowGroups) return false;
  if (!isGroup && !settings.allowPrivate) return false;
  if (settings.disabledUsers.includes(sender)) return false;

  return true;
}

function predictIntent(text) {
  const scores = {};
  tfidf.tfidfs(text, (i, measure, key) => {
    scores[key] = (scores[key] || 0) + measure;
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
}

export default {
  name: "autoreply",
  description: "Smart NLP auto-reply handler",

  async execute(sock, m, args, config) {
    const from = m.key.remoteJid;
    const text =
      (m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        "")
        .toLowerCase()
        .trim();

    if (!text) return;
    if (!canAutoReply(m)) return;

    buildModel(config.autoReplies);

    // Phase 1 — fuzzy match
    for (const intent in config.autoReplies) {
      const examples = config.autoReplies[intent].examples || [];
      if (!examples.length) continue;

      const match = stringSimilarity.findBestMatch(text, examples);
      if (match.bestMatch.rating > 0.65) {
        await sock.sendMessage(from, {
          text: config.autoReplies[intent].reply
        });
        return;
      }
    }

    // Phase 2 — intent prediction
    const predicted = predictIntent(text);
    if (predicted && config.autoReplies[predicted]) {
      await sock.sendMessage(from, {
        text: config.autoReplies[predicted].reply
      });
      return;
    }

    // Fallback
    if (config.autoReplies.default?.reply) {
      await sock.sendMessage(from, {
        text: config.autoReplies.default.reply
      });
    }
  }
};
