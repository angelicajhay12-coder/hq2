module.exports.config = {
  name: "guard",
  eventType: ["log:thread-admins"],
  version: "1.0.0",
  credits: "Priyansh Rajput",
  description: "Prevent admin changes",
};

module.exports.run = async function ({ event, api, Threads, Users }) {
  const { logMessageType, logMessageData, senderID } = event;

  // Fetch group data and check if AntiRobbery is enabled
  let data = (await Threads.getData(event.threadID)).data;
  if (!data.guard || data.guard === false) return; // Skip if guard is off

  // Handle admin changes
  if (logMessageType === "log:thread-admins") {
    if (logMessageData.ADMIN_EVENT === "add_admin") {
      if (event.author == api.getCurrentUserID()) return;
      if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

      // Check if anti-robbery is on and prevent adding admins
      let threadData = await getData(`antirobbery/${event.threadID}`);
      if (threadData?.enabled) {
        api.changeAdminStatus(event.threadID, event.author, false);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, false);
        api.sendMessage(`» AntiRobbery mode activated! Admin role changes prevented.`, event.threadID);
      }
    } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
      if (event.author == api.getCurrentUserID()) return;
      if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

      // Check if anti-robbery is on and prevent admin removal
      let threadData = await getData(`antirobbery/${event.threadID}`);
      if (threadData?.enabled) {
        api.changeAdminStatus(event.threadID, event.author, false);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, true);
        api.sendMessage(`» AntiRobbery mode activated! Admin role changes prevented.`, event.threadID);
      }
    }
  }
};
