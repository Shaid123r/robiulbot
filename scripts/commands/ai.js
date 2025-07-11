module.exports.config = {
  name: "ai",
  version: "1.0.0",
  permission: 0,
  credits: "Jonell Magallanes",
  prefix: true,
  premium: false,
  description: "Educational AI chatbot powered by GPT-4 and image recognition.",
  category: "Utilities",
  usages: "ai [question]",
  cooldowns: 6,
};

const axios = require('axios');
const fs = require('fs');
const https = require('https');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeys = [
  "AIzaSyBAEiDoFt0no4m_rvuWnAdqj8TzPPSoESs",
  "AIzaSyAgZgBukaiCxWlm-P7zo9tmOM9499BsJp4",
  "AIzaSyArWBkp8T1izTH5Gfbgk5DFfBILkwoBAnc",
  "AIzaSyDDI6Uaond8rN4o4-iDOwKeWEaqq_Srl3Q",
  "AIzaSyDOYoqSMxnoL-JtCdtOWhfaS6swm2xC7TA"
];

const API_KEY = apiKeys[Math.floor(Math.random() * apiKeys.length)];

const fontMapping = {
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
  'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
  'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
  'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
  'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
  'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
  'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
};

function convertToBold(text) {
  return text.replace(/\*(.*?)\*/g, (match, p1) => [...p1].map(char => fontMapping[char] || char).join(''))
    .replace(/### (.*?)(\n|$)/g, (match, p1) => `${[...p1].map(char => fontMapping[char] || char).join('')}`);
}

module.exports.handleReply = async ({ handleReply, event, api }) => {
  const { threadID, senderID } = event;
  const followUpApiUrl = `https://jonellccapisbkup.gotdns.ch/api/gpt4o?ask=${encodeURIComponent(handleReply.message)}&id=${senderID}`;
  api.setMessageReaction("⏱️", event.messageID, () => {}, true);

  try {
    const response = await axios.get(followUpApiUrl);
    const followUpResult = convertToBold(response.data.response);
    api.setMessageReaction("✅", event.messageID, () => {}, true);
api.sendMessage(followUpResult, threadID, event.messageID);
  } catch (error) {
    api.sendMessage(`Error: ${error.message}`, threadID);
  }
};

module.exports.run = async ({ event, api, args }) => {
  const { messageID, threadID, senderID } = event;

  if (!args.length) {
    return api.sendMessage("Please provide your question.\n\nExample: ai what is the solar system?", threadID, messageID);
  }

  const apiUrl = `https://jonellccapisbkup.gotdns.ch/api/gpt4o?ask=${encodeURIComponent(args.join(" "))}&id=${senderID}`;
  const lad = await api.sendMessage("🔎 Searching for an answer. Please wait...", threadID, messageID);

  try {
    if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo") {
      const imageURL = event.messageReply.attachments[0].url;
      const imagePath = "./downloadedImage.jpg";
      const file = fs.createWriteStream(imagePath);

      https.get(imageURL, (response) => {
        response.pipe(file);
        file.on("finish", async () => {
          const genAI = new GoogleGenerativeAI(API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          try {
            const image = {
              inlineData: {
                data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
                mimeType: "image/png",
              },
            };
            const result = await model.generateContent([args.join(" "), image]);
            const vision = convertToBold(result.response.text());

            if (vision) {
              api.editMessage(`𝗚𝗲𝗺𝗶𝗻𝗶 𝗩𝗶𝘀𝗶𝗼𝗻 𝗜𝗺𝗮𝗴𝗲 𝗥𝗲𝗰𝗼𝗴𝗻𝗶𝘁𝗶𝗼𝗻\n━━━━━━━━━━━━━━━━━━\n${vision}\n━━━━━━━━━━━━━━━━━━\n`, lad.messageID);
            } else {
              api.sendMessage("🤖 Failed to recognize the image.", threadID);
            }
          } catch {
            api.sendMessage("Error during image recognition.", threadID);
          }
        });
      });
    } else {
      const response = await axios.get(apiUrl);
      const result = convertToBold(response.data.response);
      
      api.editMessage(`${result}`, lad.messageID);
    }

    global.client.handleReply.push({
      name: this.config.name,
      messageID: lad.messageID,
      author: senderID,
    });
  } catch (error) {
    api.editMessage(`❌ Error: ${error.message}`, lad.messageID);
  }
};
