module.exports.config = {
    name: "guard",
    eventType: ["log:thread-admins"],  // We're listening for admin changes
    version: "1.0.0",
    credits: "𝙋𝙧𝙞𝙮𝙖𝙣𝙨𝙝 𝙍𝙖𝙟𝙥𝙪𝙩",
    description: "Prevent admin changes",
};

module.exports.run = async function ({ event, api, Threads, Users }) {
    const { logMessageType, logMessageData, senderID } = event;

    // Fetch the thread settings from the database
    let data = (await Threads.getData(event.threadID)).data;
    if (!data || data.guard === false) return; // If the guard is disabled, exit

    if (data.guard === true) {
        switch (logMessageType) {
            case "log:thread-admins":
                if (logMessageData.ADMIN_EVENT == "add_admin") {
                    // Prevent adding the bot as an admin
                    if (event.author === api.getCurrentUserID()) return;
                    if (logMessageData.TARGET_ID === api.getCurrentUserID()) return;

                    // If a user adds an admin, remove their admin status
                    try {
                        await api.changeAdminStatus(event.threadID, event.author, false);
                        await api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, false);
                        api.sendMessage("❌ Admin role has been removed from you for attempting to add an unauthorized admin.", event.threadID);
                    } catch (err) {
                        api.sendMessage("Error occurred while changing admin status.", event.threadID);
                        console.error("Failed to modify admin status:", err);
                    }
                    break;
                }

                if (logMessageData.ADMIN_EVENT == "remove_admin") {
                    // Prevent the bot from being removed as an admin
                    if (event.author === api.getCurrentUserID()) return;
                    if (logMessageData.TARGET_ID === api.getCurrentUserID()) return;

                    // If a user removes an admin, restore admin status for the removed user
                    try {
                        await api.changeAdminStatus(event.threadID, event.author, false);
                        await api.changeAdminStatus(event.threadID, logMessageData.TARGET_ID, true);
                        api.sendMessage("✅ Admin role has been restored for the removed admin.", event.threadID);
                    } catch (err) {
                        api.sendMessage("Error occurred while changing admin status.", event.threadID);
                        console.error("Failed to modify admin status:", err);
                    }
                    break;
                }

                break;
        }
    }
};
