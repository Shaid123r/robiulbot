const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "toilet",
  version: "1.0.0",
  permission: 0,
  credits: "Robiul",
  description: "Put someone in the toilet 🚽",
  prefix: true,
  category: "fun",
  usages: "toilet @mention",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const dir = path.join(__dirname, "cache");
  const imgPath = path.join(dir, "toilet.png");

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(imgPath)) {
    const res = await axios.get("https://i.ibb.co/BKHws1hZ/toilet.png", {
      responseType: "arraybuffer"
    });
    fs.writeFileSync(imgPath, Buffer.from(res.data));
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(uid1, uid2) {
  const canvasPath = path.join(__dirname, "cache");
  const bg = await jimp.read(path.join(canvasPath, "toilet.png"));

  const avatar1 = path.join(canvasPath, `avt_${uid1}.png`);
  const avatar2 = path.join(canvasPath, `avt_${uid2}.png`);
  const output = path.join(canvasPath, `toilet_${uid1}_${uid2}.png`);

  const getAvatar = async (uid, filePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data));
  };

  await getAvatar(uid1, avatar1);
  await getAvatar(uid2, avatar2);

  const img1 = await jimp.read(await circle(avatar1));
  const img2 = await jimp.read(await circle(avatar2));

  // Resize background and place avatars
  bg.resize(292, 345);
  bg.composite(img1.resize(70, 70), 100, 200); // Both avatars on same spot (can be changed)
  bg.composite(img2.resize(70, 70), 100, 200);

  const buffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(output, buffer);

  fs.unlinkSync(avatar1);
  fs.unlinkSync(avatar2);

  return output;
}

module.exports.run = async function ({ api, event, Currencies }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);
  const fs = require("fs-extra");

  if (!mentionIDs[0]) {
    return api.sendMessage("🚽 টয়লেটে বসাতে হলে একজনকে ট্যাগ করো!", threadID, messageID);
  }

  const targetID = mentionIDs[0];
  const hc = Math.floor(Math.random() * 101);
  const reward = Math.floor(Math.random() * 100000) + 100000;
  await Currencies.increaseMoney(senderID, hc * reward);

  const imagePath = await makeImage(senderID, targetID);

  return api.sendMessage({
    body: `🚽 আপনি এই লোককে টয়লেটে বসালেন!\n💸 আপনি পেয়েছেন ${hc * reward} 🪙`,
    attachment: fs.createReadStream(imagePath)
  }, threadID, () => fs.unlinkSync(imagePath), messageID);
};