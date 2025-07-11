const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.1",
  permission: 0,
  credits: "Robiul",
  description: "Pair two users with a fun compatibility score",
  prefix: true,
  category: "fun",
  usages: "pair",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const imgDir = path.join(__dirname, "cache", "canvas");
  const imgPath = path.join(imgDir, "pairing.png");
  const { downloadFile } = global.utils;

  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  if (!fs.existsSync(imgPath)) {
    await downloadFile("https://i.ibb.co/nVbbkXJ/pairing.png", imgPath);
  }
};

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(uid1, uid2) {
  const canvasPath = path.join(__dirname, "cache", "canvas");
  const bg = await jimp.read(path.join(canvasPath, "pairing.png"));

  const avatar1 = path.join(canvasPath, `avt_${uid1}.png`);
  const avatar2 = path.join(canvasPath, `avt_${uid2}.png`);
  const output = path.join(canvasPath, `pairing_${uid1}_${uid2}.png`);

  const getAvatar = async (uid, filePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data));
  };

  await getAvatar(uid1, avatar1);
  await getAvatar(uid2, avatar2);

  const img1 = await jimp.read(await circle(avatar1));
  const img2 = await jimp.read(await circle(avatar2));

  bg.composite(img1.resize(150, 150), 980, 200)
    .composite(img2.resize(150, 150), 140, 200);

  const buffer = await bg.getBufferAsync("image/png");
  fs.writeFileSync(output, buffer);

  fs.unlinkSync(avatar1);
  fs.unlinkSync(avatar2);

  return output;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Match percentage list
  const percentages = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  // Sender info
  const senderInfo = await api.getUserInfo(senderID);
  const senderName = senderInfo[senderID].name;

  // Random participant (excluding sender)
  const threadInfo = await api.getThreadInfo(threadID);
  const otherParticipants = threadInfo.participantIDs.filter(id => id !== senderID);
  const partnerID = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
  const partnerInfo = await api.getUserInfo(partnerID);
  const partnerName = partnerInfo[partnerID].name;

  const mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  const imagePath = await makeImage(senderID, partnerID);

  return api.sendMessage({
    body: `💞 *Pairing Complete!*\n\n✨ ${senderName} ➕ ${partnerName}\n📊 Match Rate: ${matchRate}\n💘 Destiny brought you together!\n\n📷 Look how cute you two look together 👇`,
    mentions,
    attachment: fs.createReadStream(imagePath)
  }, threadID, () => fs.unlinkSync(imagePath), messageID);
};