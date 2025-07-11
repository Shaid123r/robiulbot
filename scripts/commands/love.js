const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "love",
  version: "2.0.0",
  permission: 0,
  credits: "robiul", // ⚠️ এই লাইন চেঞ্জ করলে কাজ করবে না
  description: "Create a love frame with you and the mentioned person",
  prefix: true,
  category: "Love",
  usages: "@mention",
  cooldowns: 5,
};

module.exports.onLoad = async () => {
  const filePath = path.resolve(__dirname, "cache/canvas/crush11115522.png");
  const dirPath = path.resolve(__dirname, "cache/canvas");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  if (!fs.existsSync(filePath)) {
    const { downloadFile } = global.utils;
    await downloadFile("https://i.ibb.co/JMCj67j/crush11115522.jpg", filePath); // <-- ফ্রেম ইমেজ URL দিন
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const canvasPath = path.resolve(__dirname, "cache/canvas");
  const bg = await jimp.read(path.join(canvasPath, "crush11115522.png"));
  const p1 = path.join(canvasPath, `avt_${one}.png`);
  const p2 = path.join(canvasPath, `avt_${two}.png`);
  const final = path.join(canvasPath, `love_${one}_${two}.png`);

  const avt1 = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  const avt2 = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;

  fs.writeFileSync(p1, Buffer.from(avt1));
  fs.writeFileSync(p2, Buffer.from(avt2));

  const circle1 = await jimp.read(await circle(p1));
  const circle2 = await jimp.read(await circle(p2));

  bg.composite(circle1.resize(196, 196), 98, 141)
    .composite(circle2.resize(193, 193), 427, 143);

  fs.writeFileSync(final, await bg.getBufferAsync("image/png"));

  fs.unlinkSync(p1);
  fs.unlinkSync(p2);

  return final;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;


  const currentCredit = module.exports.config.credits;
  if (currentCredit !== "robiul") {
    return api.sendMessage("❌ এই কমান্ডের credits পরিবর্তন করা হয়েছে বলে এটি আর কাজ করবে না!", threadID, messageID);
  }

  const mentionIDs = Object.keys(mentions);
  if (!mentionIDs[0]) {
    return api.sendMessage("⚠️ যার সাথে ফ্রেম বানাতে চান তাকে মেনশন করুন!", threadID, messageID);
  }

  const targetID = mentionIDs[0];
  try {
    const pathImg = await makeImage({ one: senderID, two: targetID });
    return api.sendMessage({
      body: "•🦋💛🌸\n\nবাধিয়ে রেখে লাভ নেই\n উড়িয়ে দিয়ে দেখো\nদিন শেষে ফিরে আসে\n তখনি আগলে রেখো\n\n•😘🦋💛\n𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ━➢ 𝐉𝐨𝐲 𝐀𝐡𝐦𝐞𝐝",
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);
  } catch (err) {
    console.log(err);
    return api.sendMessage("❌ ফ্রেম তৈরিতে সমস্যা হয়েছে!", threadID, messageID);
  }
};