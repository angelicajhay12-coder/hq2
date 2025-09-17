const { setData, getData } = require("../../database.js");

module.exports.config = {
  name: "antirobbery",
  version: "1.2.0",
  credits: "Priyansh Rajput, ChatGPT",
  hasPermission: 1,
  description: "Prevent changes to group administrators",
  usages: "/antirobbery",
  commandCategory: "admin",
  cooldowns: 0
};

// ✅ Load all saved settings at bot startup
module.exports.onLoad = async function () {
  try {
    console.log("Loading AntiRobbery data..."); // Debug log
    const allData = (await getData("antirobbery")) || {};
    global.data.antirobbery = new Map();

    for (const threadID in allData) {
      global.data.antirobbery.set(threadID, allData[threadID]);
    }

    console.log(`[ AntiRobbery ] Loaded ${global.data.antirobbery.size} threads from database ✅`);
  } catch (err) {
    console.error("[ AntiRobbery ] Failed to load data:", err);
  }
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;

  console.log("Received /antirobbery command from", senderID); // Debug log to check if the command is triggered

  // ✅ Check if the user is bot admin
  const isBotAdmin = global.config.ADMINBOT.includes(senderID);

  // ✅ Check if the user is a group admin
  const info = await api.getThreadInfo(threadID);
  const isGroupAdmin = info.adminIDs.some(item => item.id == senderID);

  // ❌ Deny if not bot admin or group admin
  if (!isBotAdmin && !isGroupAdmin) {
    return api.sendMessage(
      "[ AntiRobbery ] ❌ Only group admins or bot admins can use this command.",
      threadID,
      messageID
    );
  }

  // ✅ Get saved data (from memory or DB)
  let threadData = global.data.antirobbery?.get(threadID) || (await getData(`antirobbery/${threadID}`)) || { enabled: false };

  // Toggle ON/OFF
  threadData.enabled = !threadData.enabled;

  // ✅ Save to Firebase + memory
  await setData(`antirobbery/${threadID}`, threadData);
  global.data.antirobbery.set(threadID, threadData);

  return api.sendMessage(
    `[ AntiRobbery ] AntiRobbery has been turned ${(threadData.enabled ? "ON ✅" : "OFF ❌")}`,
    threadID,
    messageID
  );
};
