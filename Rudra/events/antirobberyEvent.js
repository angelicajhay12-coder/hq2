const { setData, getData } = require("../../database.js");

module.exports = {
  name: "antirobberyEvent",
  eventType: ["log:thread-admins"], // We're listening for admin changes
  version: "1.2.1",
  credits: "ChatGPT, Priyansh Rajput",
  description: "Prevent unauthorized admin changes",
  envConfig: {
    sendNoti: true
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, addedParticipants, removedParticipants } = event;

  // Check if AntiRobbery is enabled for the group
  let threadData = global.data.antirobbery.get(threadID) || await getData(`antirobbery/${threadID}`);
  if (!threadData || !threadData.enabled) return;

  console.log("Checking admin changes...");

  // If someone is removed from admin
  if (removedParticipants && removedParticipants.length > 0) {
    const removedUser = removedParticipants[0]; // The admin who was removed
    const removingUser = event.senderID; // The user who performed the action

    // If the user who removed the admin is not the bot
    if (removingUser !== global.config.ADMINBOT[0]) {
      try {
        // Remove admin rights from the user who performed the action
        await api.removeAdminFromGroup(removingUser, threadID);
        api.sendMessage(`❌ Removed admin role from ${removingUser} for removing another admin.`, threadID);
      } catch (error) {
        console.error("Failed to remove admin status from the user who removed an admin:", error);
      }
    }

    // Restore admin status to the removed admin (except the bot)
    if (removedUser.userFbId && removedUser.userFbId !== global.config.ADMINBOT[0]) {
      try {
        // Restore admin status for the removed user
        await api.addUserToGroup(removedUser.userFbId, threadID);
        api.sendMessage(`✅ Restored admin status for ${removedUser.userFbId}.`, threadID);
      } catch (error) {
        console.error("Failed to restore admin status:", error);
      }
    }
  }

  // If someone is added as an admin (monitoring purposes)
  if (addedParticipants && addedParticipants.length > 0) {
    console.log("Admin added, monitoring...");
    for (let addedUser of addedParticipants) {
      // Check if the added user is not the bot
      if (addedUser.userFbId !== global.config.ADMINBOT[0]) {
        // Optionally handle logic for when new admins are added
      }
    }
  }
};
