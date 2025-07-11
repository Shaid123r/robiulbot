const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "ROBIUL",
    version: "1.0",
    author: "ROBIUL",
    prefix: "true",
    countDown: 3,
    role: 2,
    shortDescription: "Limit bot interaction to admins only",
    longDescription: "Only allow group admins or selected users to talk to bot",
    category: "owner",
    guide: {
      en: "{pn} on/off\n{pn} add/remove @user\n{pn} list"
    }
  },

  onStart: async function ({ message, event, args, threadsData, usersData, api }) {
    const { threadID, senderID, messageReply, mentions } = event;
    const configPath = global.client.dirConfig;
    const config = require(configPath);

    // Default initialize if not set
    if (!config.limitedMode) {
      config.limitedMode = {
        enabled: false,
        allowIds: []
      };
    }

    const mode = config.limitedMode;

    switch (args[0]) {
      case "on":
        mode.enabled = true;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        return message.reply("✅ | Limited mode ON. Only admins or allowed users can interact.");

      case "off":
        mode.enabled = false;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        return message.reply("❎ | Limited mode OFF. Everyone can interact.");

      case "add": {
        const uids = Object.keys(mentions).length > 0
          ? Object.keys(mentions)
          : messageReply
            ? [messageReply.senderID]
            : args.slice(1).filter(uid => /^\d+$/.test(uid));

        if (uids.length === 0) return message.reply("⚠️ | Mention or provide UID to add.");

        const newlyAdded = [];
        for (const uid of uids) {
          if (!mode.allowIds.includes(uid)) {
            mode.allowIds.push(uid);
            newlyAdded.push(uid);
          }
        }

        writeFileSync(configPath, JSON.stringify(config, null, 2));
        const names = await Promise.all(newlyAdded.map(uid => usersData.getName(uid)));
        return message.reply(`✅ | Added:\n${names.map((name, i) => `├ ${name} (${newlyAdded[i]})`).join("\n")}`);
      }

      case "remove": {
        const uids = Object.keys(mentions).length > 0
          ? Object.keys(mentions)
          : messageReply
            ? [messageReply.senderID]
            : args.slice(1).filter(uid => /^\d+$/.test(uid));

        if (uids.length === 0) return message.reply("⚠️ | Mention or provide UID to remove.");

        const removed = [];
        for (const uid of uids) {
          const index = mode.allowIds.indexOf(uid);
          if (index !== -1) {
            mode.allowIds.splice(index, 1);
            removed.push(uid);
          }
        }

        writeFileSync(configPath, JSON.stringify(config, null, 2));
        return message.reply(`❎ | Removed:\n${removed.map(uid => `├ ${uid}`).join("\n")}`);
      }

      case "list":
        if (mode.allowIds.length === 0) return message.reply("⚠️ | No allowed users.");
        const list = await Promise.all(mode.allowIds.map(async uid => {
          const name = await usersData.getName(uid);
          return `├ ${name} (${uid})`;
        }));
        return message.reply("📜 Allowed Users:\n" + list.join("\n"));

      default:
        return message.reply("⚠️ | Usage:\nRobiul on/off\nRobiul add/remove @mention or UID\nRobiul list");
    }
  },

  onChat: async function ({ event, threadsData }) {
    const config = require(global.client.dirConfig);
    const { limitedMode } = config;

    if (!limitedMode?.enabled) return;

    const threadID = event.threadID;
    const senderID = event.senderID;
    const threadInfo = await threadsData.get(threadID);

    const isAdmin = threadInfo?.adminIDs?.some(e => e.id === senderID);
    const isAllowed = limitedMode.allowIds.includes(senderID);

    if (!isAdmin && !isAllowed) return false; // ⛔ block bot response
  }
};
