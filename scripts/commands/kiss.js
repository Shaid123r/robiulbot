const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "kiss",
  version: "1.0.0",
  permission: 0,
  credits: "Robiul",
  description: "Kiss someone and get blessing ❤️",
  prefix: true,
  category: "love",
  usages: "kiss @mention",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const cachePath = path.join(__dirname, "cache");
  const imgPath = path.join(cachePath, "kiss_bg.jpeg");

  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
  if (!fs.existsSync(imgPath)) {
    const url = "https://i.ibb.co/cS9Fm4b4/hon0-1.gif";
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(res.data));
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(uid1, uid2) {
  const cacheDir = path.join(__dirname, "cache");
  const bg = await jimp.read(path.join(cacheDir, "kiss_bg.jpeg"));

  const pathImg = path.join(cacheDir, `kiss_${uid1}_${uid2}.jpeg`);
  const avatar1 = path.join(cacheDir, `avt_${uid1}.png`);
  const avatar2 = path.join(cacheDir, `avt_${uid2}.png`);

  const getAvatar = async (uid, filePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data));
  };

  await getAvatar(uid1, avatar1);
  await getAvatar(uid2, avatar2);

  const circled1 = await jimp.read(await circle(avatar1));
  const circled2 = await jimp.read(await circle(avatar2));

  bg.resize(700, 440)
    .composite(circled1.resize(150, 150), 390, 23)
    .composite(circled2.resize(150, 150), 115, 130);

  const buffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, buffer);

  fs.unlinkSync(avatar1);
  fs.unlinkSync(avatar2);

  return pathImg;
}

module.exports.run = async function ({ api, event, Currencies }) {
  const { threadID, messageID, senderID, mentions } = event;
  const fs = require("fs-extra");
  const mentionIDs = Object.keys(mentions);

  if (!mentionIDs[0]) {
    return api.sendMessage("⚠️ একজনকে ট্যাগ করুন যার সাথে চুমু খেতে চান 😳", threadID, messageID);
  }

  const partnerID = mentionIDs[0];
  const affection = Math.floor(Math.random() * 101);
  const blessing = affection * (Math.floor(Math.random() * 100000) + 100000);

  // টাকা বাড়িয়ে দিন
  await Currencies.increaseMoney(senderID, blessing);

  const imgPath = await makeImage(senderID, partnerID);

  return api.sendMessage({
    body:
      `💋 আপনি ${mentions[partnerID].replace("@", "")}-কে একটি চুমু দিলেন!\n❤️ ভালবাসার হার: ${affection}%\n💸 আশীর্বাদ হিসাবে পেলেন: ${blessing}$\n🍀 শুভ কামনা রইল!`,
    attachment: fs.createReadStream(imgPath)
  }, threadID, () => fs.unlinkSync(imgPath), messageID);
};