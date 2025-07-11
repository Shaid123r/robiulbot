const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "hug",
  version: "1.0.0",
  permission: 0,
  credits: "Robiul Ahmed",
  description: "Hug your tagged friend with a custom image",
  prefix: true,
  category: "image",
  usages: "hug @mention",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const dirPath = path.join(__dirname, "cache/canvas");
  const bgPath = path.join(dirPath, "hugv1.png");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  if (!fs.existsSync(bgPath)) {
    const imgURL = "https://i.ibb.co/wVJ3tWh/hugv1.jpg";
    const response = await axios.get(imgURL, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(response.data));
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(uid1, uid2) {
  const canvasPath = path.join(__dirname, "cache/canvas");
  const bg = await jimp.read(path.join(canvasPath, "hugv1.png"));

  const pathImg1 = path.join(canvasPath, `avt_${uid1}.png`);
  const pathImg2 = path.join(canvasPath, `avt_${uid2}.png`);
  const finalPath = path.join(canvasPath, `hug_${uid1}_${uid2}.png`);

  const getAvt = async (uid, filePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data));
  };

  await getAvt(uid1, pathImg1);
  await getAvt(uid2, pathImg2);

  const avatar1 = await jimp.read(await circle(pathImg1));
  const avatar2 = await jimp.read(await circle(pathImg2));

  bg.composite(avatar1.resize(150, 150), 320, 100);
  bg.composite(avatar2.resize(130, 130), 280, 280);

  const finalBuffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(finalPath, finalBuffer);

  fs.unlinkSync(pathImg1);
  fs.unlinkSync(pathImg2);

  return finalPath;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);

  if (mentionIDs.length === 0) {
    return api.sendMessage("⚠️ দয়া করে একজনকে মেনশন করুন।", threadID, messageID);
  }

  const pathImg = await makeImage(senderID, mentionIDs[0]);
  return api.sendMessage({
    body: "🤗 Here's your hug!",
    attachment: fs.createReadStream(pathImg)
  }, threadID, () => fs.unlinkSync(pathImg), messageID);
};