const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "love3",
  version: "7.3.1",
  permssion: 0,
  credits: "Robiul",
  prefix: true,
  category: "Love",
  description: "Get a love frame with the tagged person",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    path: "",
    jimp: ""
  }
};

module.exports.onLoad = async () => {
  const imgPath = path.join(__dirname, "cache", "canvas");
  const imgFile = path.join(imgPath, "pp.png");
  const { downloadFile } = global.utils;

  if (!fs.existsSync(imgPath)) fs.mkdirSync(imgPath, { recursive: true });

  // Make sure image is downloaded only once
  if (!fs.existsSync(imgFile)) {
    await downloadFile("https://i.ibb.co/HLWc2HpG/pp.jpg", imgFile); // Replace with your background image URL
  }
};

async function circleImage(imgPath) {
  const image = await jimp.read(imgPath);
  image.circle();
  return image.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const canvasPath = path.join(__dirname, "cache", "canvas");
  const bg = await jimp.read(path.join(canvasPath, "pp.png"));

  const onePath = path.join(canvasPath, `avt_${one}.png`);
  const twoPath = path.join(canvasPath, `avt_${two}.png`);

  // Download avatars
  const oneAvatar = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(onePath, Buffer.from(oneAvatar, "utf-8"));

  const twoAvatar = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(twoPath, Buffer.from(twoAvatar, "utf-8"));

  const circOne = await jimp.read(await circleImage(onePath));
  const circTwo = await jimp.read(await circleImage(twoPath));

  // Composite avatars on background
  bg.composite(circOne.resize(235, 232), 511, 123);
  bg.composite(circTwo.resize(229, 225), 95, 126);

  const outputPath = path.join(canvasPath, `love3_${one}_${two}.png`);
  const buffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(outputPath, buffer);

  // Cleanup
  fs.unlinkSync(onePath);
  fs.unlinkSync(twoPath);

  return outputPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);

  if (mentionIDs.length === 0) {
    return api.sendMessage("💞 দয়া করে কাউকে ট্যাগ করুন যার সাথে আপনি ফ্রেম বানাতে চান!", threadID, messageID);
  }

  const taggedID = mentionIDs[0];

  const img = await makeImage({ one: senderID, two: taggedID });

  return api.sendMessage({
    body: `- 𝗧𝗵𝗶𝘀 𝗮𝗯𝗼𝘂𝘁 𝗹𝗶𝗻𝗲-!! 🖤🤍\nপ্রিয়__😽💚🌺\n\nতুমি ফুল হয়ে থেকে যাও আমি যত্ন করে রেখে দিব-!😘🤍🙃\n𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ━➢ 𝐉𝐨𝐲 𝐀𝐡𝐦𝐞𝐝`,
    attachment: fs.createReadStream(img)
  }, threadID, () => fs.unlinkSync(img), messageID);
};