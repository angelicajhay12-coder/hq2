const { setData, getData } = require("../../database.js");

module.exports.config = {
    name: "antirobbery",
    version: "1.2.0",
    credits: "Priyansh Rajput, ChatGPT",
    hasPermssion: 1,
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

// Event to monitor admin changes in the group
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
