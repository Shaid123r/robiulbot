const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "love2",
  version: "2.0.0",
  permssion: 0,
  credits: "Robiul",
  description: "Create love frame with you and tagged person",
  prefix: true,
  category: "Love",
  usages: "[mention]",
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
  const imgFile = path.join(imgPath, "crush112.png");
  const { downloadFile } = global.utils;

  if (!fs.existsSync(imgPath)) fs.mkdirSync(imgPath, { recursive: true });
  if (!fs.existsSync(imgFile)) await downloadFile("https://i.ibb.co/GQdpZvb0/crush112.jpg", imgFile); // Change to your background URL
};

async function circleImg(imagePath) {
  const image = await jimp.read(imagePath);
  image.circle();
  return image.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const imgPath = path.join(__dirname, "cache", "canvas");
  const baseImg = await jimp.read(path.join(imgPath, "crush112.png"));

  const oneAvtPath = path.join(imgPath, `avt_${one}.png`);
  const twoAvtPath = path.join(imgPath, `avt_${two}.png`);

  const oneImg = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(oneAvtPath, Buffer.from(oneImg, "utf-8"));

  const twoImg = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(twoAvtPath, Buffer.from(twoImg, "utf-8"));

  const circOne = await jimp.read(await circleImg(oneAvtPath));
  const circTwo = await jimp.read(await circleImg(twoAvtPath));

  baseImg.composite(circOne.resize(217, 217), 98, 143);
  baseImg.composite(circTwo.resize(216, 216), 538, 144);

  const finalPath = path.join(imgPath, `love2_${one}_${two}.png`);
  const buffer = await baseImg.getBufferAsync("image/png");
  fs.writeFileSync(finalPath, buffer);

  fs.unlinkSync(oneAvtPath);
  fs.unlinkSync(twoAvtPath);

  return finalPath;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);

  if (mentionIDs.length === 0) {
    return api.sendMessage("🥺 যাকে Tag করবেন তার সাথে একটা সুন্দর মুহূর্ত ফ্রেমে বাঁধবো! অনুগ্রহ করে কাউকে mention করুন।", threadID, messageID);
  }

  const taggedID = mentionIDs[0];
  const imgPath = await makeImage({ one: senderID, two: taggedID });

  return api.sendMessage({
    body: "•🦋💛🌸\n\nছেড়ে যাওয়ার শহরে বাধীয়ে রাখার\n একটা তুমি হোক\nহোকনা সেটা যেমন তেমন\n গড়ে নিবো মনের মতন\n\n•😘🦋💛\n𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ━➢ 𝐉𝐨𝐲 𝐀𝐡𝐦𝐞𝐝",
    attachment: fs.createReadStream(imgPath)
  }, threadID, () => fs.unlinkSync(imgPath), messageID);
};