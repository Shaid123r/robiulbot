const fs = require("fs-extra");
const request = require("request");
const moment = require("moment-timezone");

module.exports.config = {
  name: "uptime",
  version: "1.0.4",
  permission: 0,
  credits: Buffer.from("Sm95", "base64").toString(), // Robiul
  description: "Show bot uptime with profile pic",
  prefix: true,
  category: "System",
  cooldowns: 1
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // 🔐 Credit Protection
  const expected = Buffer.from("Sm95", "base64").toString();
  if (module.exports.config.credits !== expected) {
    return api.sendMessage("❌ This command has been locked due to credit tampering.", threadID, messageID);
  }

  // 🕒 Uptime calculation
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const now = moment.tz("Asia/Dhaka").format("『D/MM/YYYY』 【hh:mm:ss A】");

  // 📸 Download Facebook profile picture using request.pipe
  const imgPath = __dirname + "/cache/1.png";
  const fbUID = "100001435123762"; // ⬅️ তোমার ফেসবুক UID
  const imgURL = `https://graph.facebook.com/${fbUID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const callback = () => {
    const botName = global.config.BOTNAME || "YourBot";

    api.sendMessage({
      body:
        `🕘 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗘𝗣𝗢𝗥𝗧\n\n` +
        `🤖 𝗕𝗢𝗧 𝗡𝗔𝗠𝗘: ${botName}\n` +
        `📌 𝗣𝗥𝗘𝗙𝗜𝗫: ${global.config.PREFIX}\n` +
        `🕒 𝗧𝗜𝗠𝗘 𝗡𝗢𝗪: ${now}\n\n` +
        `✅ 𝗥𝗨𝗡𝗡𝗜𝗡𝗚:\n  ➤ ${hours} Hours\n  ➤ ${minutes} Minutes\n  ➤ ${seconds} Seconds\n\n` +
        `👑 𝗢𝗪𝗡𝗘𝗥: 𝗝𝗢𝗬 𝗔𝗛𝗠𝗘𝗗\n🧠 𝗖𝗥𝗘𝗔𝗧𝗢𝗥: 𝗝𝗢𝗬 𝗔𝗛𝗠𝗘𝗗`,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => fs.unlinkSync(imgPath), messageID);
  };

  // 📥 Download and run callback
  return request(encodeURI(imgURL))
    .pipe(fs.createWriteStream(imgPath))
    .on("close", () => callback());
};