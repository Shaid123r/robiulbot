const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "hug2",
  version: "1.0.0",
  permission: 0,
  credits: "Robiul",
  description: "Send a hug image with your tagged friend",
  prefix: true,
  category: "image",
  usages: "hugv2 @mention",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const dir = path.join(__dirname, "cache/canvas");
  const imgPath = path.join(dir, "hugv2.png");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(imgPath)) {
    const url = "https://i.ibb.co/rfkDxnYv/hugv2.jpg";
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
  const canvasPath = path.join(__dirname, "cache/canvas");
  const bg = await jimp.read(path.join(canvasPath, "hugv2.png"));

  const avatarPath1 = path.join(canvasPath, `avt_${uid1}.png`);
  const avatarPath2 = path.join(canvasPath, `avt_${uid2}.png`);
  const outputPath = path.join(canvasPath, `hugv2_${uid1}_${uid2}.png`);

  const getAvatar = async (uid, filePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data));
  };

  await getAvatar(uid1, avatarPath1);
  await getAvatar(uid2, avatarPath2);

  const img1 = await jimp.read(await circle(avatarPath1));
  const img2 = await jimp.read(await circle(avatarPath2));

  bg.composite(img1.resize(100, 100), 370, 40);
  bg.composite(img2.resize(100, 100), 330, 150);

  const finalBuffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(outputPath, finalBuffer);

  fs.unlinkSync(avatarPath1);
  fs.unlinkSync(avatarPath2);

  return outputPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);

  if (mentionIDs.length === 0) {
    return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন।", threadID, messageID);
  }

  const imgPath = await makeImage(senderID, mentionIDs[0]);

  return api.sendMessage({
    body: "🤗 Here's a warm hug!",
    attachment: fs.createReadStream(imgPath)
  }, threadID, () => fs.unlinkSync(imgPath), messageID);
};