// 🧠 Simple auto-moderation system
const spamTracker = new Map();

// 🧩 List of bad words
const bannedWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "nigger",
  "slut",
  "whore",
  "idiot"
];

// ⚙️ Function to detect bad words
export function detectBadWords(text) {
  const lower = text.toLowerCase();
  return bannedWords.find((w) => lower.includes(w));
}

// ⚙️ Function to track spam
export function checkSpam(user) {
  const now = Date.now();
  const record = spamTracker.get(user) || { count: 0, last: now };

  const diff = now - record.last;
  record.last = now;

  // If messages come too quickly
  if (diff < 2000) record.count += 1;
  else record.count = 1;

  spamTracker.set(user, record);
  return record.count;
}

// ⚙️ Reset spam counter after some time
setInterval(() => {
  spamTracker.clear();
}, 60 * 1000);
