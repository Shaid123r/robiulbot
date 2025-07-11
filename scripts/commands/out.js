module.exports = {
  config: {
    name: "out",
    version: "1.0.0",
    credits: "Robiul",
    description: "Bot leaves the group when an admin uses this command",
    usage: ".out",
    cooldowns: 5,
    permissions: 2, // Only admins
    prefix: false,
    category: "admin"
  },

  start: async function ({ api, event }) {
    const threadID = event.threadID;

    // Check if this is a group
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.isGroup) {
      return api.sendMessage("❌ এই কমান্ড শুধুমাত্র গ্রুপে ব্যবহার করা যাবে।", threadID);
    }

    // Check if the user is an admin
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === event.senderID);
    if (!isAdmin) {
      return api.sendMessage("❌ কেবলমাত্র গ্রুপ অ্যাডমিনরা এই কমান্ড ব্যবহার করতে পারবেন।", threadID);
    }

    // Leave the group
    api.sendMessage("👋 ঠিক আছে, আমি গ্রুপ থেকে চলে যাচ্ছি...", threadID, () => {
      api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    });
  }
};
