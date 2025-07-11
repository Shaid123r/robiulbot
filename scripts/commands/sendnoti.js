module.exports.config = {
  name: "sendnoti",
  version: "1.2",
  permission: 2, // Only bot admin (bot admin permission)
  credits: "Robiul",
  description: "Sends a message/photo/video/sticker/file to all groups (bot admin only).",
  prefix: true,
  category: "message",
  usages: "[reply to media or text]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  // Check permission: only bot admin can use
  const botInfo = await api.getCurrentUserID();
  const botAdminIDs = [botInfo]; // or you can get full admin list if you have multiple admins

  // Here assuming permission:2 means bot admin; you can check senderID == bot admin ID
  if (senderID !== botInfo) {
    return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র বট অ্যাডমিনদের জন্য!", threadID, messageID);
  }

  // Prepare notification content
  let notifMessage = "";
  let attachments = [];

  // If reply message exists, copy text + attachments from it
  if (messageReply) {
    notifMessage = messageReply.body || "";
    if (messageReply.attachments && messageReply.attachments.length > 0) {
      attachments = messageReply.attachments.map(att => att.url);
    }
  } else {
    notifMessage = args.join(" ");
    if (!notifMessage) {
      return api.sendMessage("📌 বিজ্ঞপ্তি পাঠানোর জন্য কোনো মেসেজ দিন বা রিপ্লাই করুন।", threadID, messageID);
    }
  }

  // Fetch all threads (groups)
  let threadList = [];
  try {
    threadList = await api.getThreadList(100, null, ["INBOX"]);
  } catch (error) {
    return api.sendMessage("❌ থ্রেড লিস্ট আনতে সমস্যা হয়েছে!", threadID, messageID);
  }

  let sentCount = 0;
  let notSentCount = 0;

  // Inform starting
  const sendMsg = await api.sendMessage("⏳ বিজ্ঞপ্তি পাঠানো শুরু হয়েছে...", threadID, messageID);

  // Function to send message with or without attachments
  async function sendToThread(thread) {
    try {
      // If no attachments, just send text
      if (attachments.length === 0) {
        await api.sendMessage(
          `📢 বিজ্ঞপ্তি\n━━━━━━━━━━━━━━\n${notifMessage}`,
          thread.threadID
        );
      } else {
        // For media attachments, send as attachment(s) with caption text
        // Facebook API may limit sending multiple attachments in one message,
        // so send first attachment with caption, then send others without caption.

        // Send first attachment with caption
        await api.sendMessage(
          {
            body: `📢 বিজ্ঞপ্তি\n━━━━━━━━━━━━━━\n${notifMessage}`,
            attachment: await api.getStream(attachments[0])
          },
          thread.threadID
        );

        // Send remaining attachments (if any)
        for (let i = 1; i < attachments.length; i++) {
          await api.sendMessage(
            await api.getStream(attachments[i]),
            thread.threadID
          );
        }
      }
      sentCount++;
    } catch (error) {
      console.error(`Error sending to thread ${thread.threadID}:`, error);
      notSentCount++;
    }
  }

  // Loop through group threads (exclude current thread to avoid spam)
  for (const thread of threadList) {
    if (sentCount >= 20) break; // limit to 20 groups per run

    if (thread.isGroup && thread.threadID !== threadID) {
      await sendToThread(thread);
    }
  }

  // Summary
  let summary = `✅ বিজ্ঞপ্তি সফলভাবে পাঠানো হয়েছে ${sentCount} গ্রুপে।`;
  if (notSentCount > 0) summary += `\n❌ ${notSentCount} গ্রুপে পাঠানো যায়নি।`;

  // Edit the "sending" message to summary
  await api.editMessage(summary, sendMsg.messageID, threadID);
};
