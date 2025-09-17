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
    const threadData = await getData(`antirobbery/${event.threadID}`); // Get AntiRobbery status from the database
    if (threadData?.enabled) {
      if (logMessageData.ADMIN_EVENT === "add_admin") {
        if (event.author == api.getCurrentUserID()) return;
        if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

        // Prevent adding new admins
        api.changeAdminStatus(event.threadID, event.author, false);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, false);
        api.sendMessage(`» AntiRobbery mode activated! Admin role changes prevented.`, event.threadID);
      }
      else if (logMessageData.ADMIN_EVENT === "remove_admin") {
        if (event.author == api.getCurrentUserID()) return;
        if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

        // Prevent removing admins
        api.changeAdminStatus(event.threadID, event.author, false);
        api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, true);
        api.sendMessage(`» AntiRobbery mode activated! Admin role changes prevented.`, event.threadID);
      }
    }
  }
};
