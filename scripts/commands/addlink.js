const axios = require("axios");

module.exports.config = {
  name: "addlink",
  version: "1.0.0",
  permission: 1, // শুধু অ্যাডমিনরা চালাতে পারবে
  credits: "Robiul Ahmed",
  description: "Facebook profile link দিয়ে গ্রুপে অ্যাড করুন",
  prefix: true,
  category: "group",
  usages: "[Facebook profile link]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const link = args[0];

  if (!link || !link.includes("facebook.com")) {
    return api.sendMessage("❌ সঠিক Facebook প্রোফাইল লিংক দিন।\nউদাহরণ: facebook.com/zuck", event.threadID, event.messageID);
  }

  try {
    // Graph API দিয়ে UID বের করা
    const res = await axios.get(`https://graph.facebook.com/v17.0/?id=${encodeURIComponent(link)}&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`);

    if (res.data && res.data.id) {
      const uid = res.data.id;

      // UID দিয়ে গ্রুপে অ্যাড করা
      api.addUserToGroup(uid, event.threadID, (err) => {
        if (err) {
          return api.sendMessage(`❌ ইউজারকে গ্রুপে অ্যাড করা যায়নি। সম্ভবত:\n- সে Already গ্রুপে আছে\n- আপনি Bot কে Admin দেননি\n- প্রাইভেসি সেটিংস ব্লক করছে`, event.threadID, event.messageID);
        } else {
          return api.sendMessage(`✅ সফলভাবে UID ${uid} কে গ্রুপে অ্যাড করা হয়েছে।`, event.threadID, event.messageID);
        }
      });
    } else {
      return api.sendMessage("❌ UID খুঁজে পাওয়া যায়নি, লিংকটি সঠিক কিনা চেক করুন।", event.threadID, event.messageID);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ কিছু ভুল হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
