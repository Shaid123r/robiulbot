module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  permission: 0,
  credits: "Robiul",
  prefix: true,
  description: "guide",
  category: "system",
  premium: false,
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  var { threadID, messageID, body, senderID } = event;
  function out(data) {
    api.sendMessage(data, threadID, messageID)
  }
  var dataThread = (await Threads.getData(threadID));
  var data = dataThread.data; 
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};

  var arr = ["mpre","mprefix","prefix", "command mark", "What is the prefix of the bot?","PREFIX"];
  arr.forEach(i => {
    let str = i[0].toUpperCase() + i.slice(1);
    if (body === i.toUpperCase() | body === i | str === body) {
    const prefix = threadSetting.PREFIX || global.config.PREFIX;
      if (config.PREFIX == null) {
        return api.shareContact(`╭╼|━━━━━━━━━━━━━━|╾╮\n𝐏𝐫𝐞𝐟𝐢𝐱: ${global.config.PREFIX}\n╰╼|━━━━━━━━━━━━━━|╾╯\n\n╭╼|━━━━━━━━━━━━━━|╾╮\n𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫: 𝐉𝐨𝐲 𝐀𝐡𝐦𝐞𝐝\n 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: https://www.facebook.com/profile.php?id=100001435123762\n ╰╼|━━━━━━━━━━━━━━|╾╯`, api.getCurrentUserID(), event.threadID);
      }
      else return api.shareContact(`╭╼|━━━━━━━━━━━━━━|╾╮\n𝐏𝐫𝐞𝐟𝐢𝐱: ${global.config.PREFIX}\n╰╼|━━━━━━━━━━━━━━|╾╯\n\n╭╼|━━━━━━━━━━━━━━|╾╮\n𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫: 𝐉𝐨𝐲 𝐀𝐡𝐦𝐞𝐝\n 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: https://www.facebook.com/profile.php?id=100001435123762\n ╰╼|━━━━━━━━━━━━━━|╾╯`, api.getCurrentUserID(), event.threadID);
    }

  });
};

module.exports.run = async({ event, api }) => {
    return api.sendMessage("no prefix commands 😂😆", event.threadID)
}