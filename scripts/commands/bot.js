const axios = require("axios");

module.exports.config = {
  name: "bot",
  version: "1.0.1",
  permission: 0,
  prefix: false,
  credits: "Robiul",
  description: "Chatbot with GitHub JSON replies",
  category: "fun",
  usages: "bot [question]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users }) {
  const name = await Users.getNameUser(event.senderID);
  const prompt = args.join(" ").trim().toLowerCase();

  const fallbackReplies = [
    "আমি এখন জয় বস এর সাথে বিজি আছি",
    "what are you asking me to do?",
    "I love you baby meye hole chipay aso",
    "Love you 3000-😍💋💝",
    "ji bolen ki korte pari ami apnar jonno?",
    "আমাকে না ডেকে আমার বস জয়কে ডাকেন! link: https://www.facebook.com/100001435123762",
    "Hmm jan ummah😘😘",
    "তুমি কি আমাকে ডাকলে বন্ধু 🤖?",
    "ভালোবাসি তোমাকে 🤖",
    "Hi, 🤖 i can help you~~~~"
  ];

  // ➤ ইউজার কিছু না লিখলে
  if (!prompt) {
    const rand = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return api.sendMessage(
      `╭────────────❍\n╰➤ 👤 ${name},\n╰➤ 🗣️ ${rand}\n╰─────────────────➤`,
      event.threadID,
      event.messageID
    );
  }

  // ➤ ইউজার প্রশ্ন দিলে — JSON থেকে match করো
  try {
    const res = await axios.get(`https://raw.githubusercontent.com/JUBAED-AHMED-Robiul/Robiul/main/api.json`);
    const dataset = res.data.data;

    // প্রশ্ন match করো (exact match, lower case)
    const match = dataset.find(item => item.ask.toLowerCase() === prompt);

    if (match) {
      return api.sendMessage(match.reply, event.threadID, event.messageID);
    } else {
      return api.sendMessage("🤖 আমি এটা শিখিনি!", event.threadID, event.messageID);
    }

  } catch (err) {
    console.error("❌ Bot API Error:", err.message);
    const rand = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return api.sendMessage(`🤖 ${rand}`, event.threadID, event.messageID);
  }
};
