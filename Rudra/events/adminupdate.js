const fs = require("fs");

module.exports.config = {
  name: "adminUpdate",
  eventType: [
    "log:thread-admins", // Monitor admin changes
    "log:thread-name",
    "log:user-nickname",
    "log:thread-icon",
    "log:thread-color",
    "log:magic-emoji" // quick reaction
  ],
  version: "1.0.2",
  credits: "Edited by ChatGPT",
  description: "Update team information quickly",
  envConfig: {
    sendNoti: true,
  }
};

module.exports.run = async function ({ event, api, Threads, Users }) {
  const iconPath = __dirname + "/emoji.json";

  if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));
  const { threadID, logMessageType, logMessageData } = event;
  const { setData, getData } = Threads;

  const thread = global.data.threadData.get(threadID) || {};
  if (typeof thread["adminUpdate"] != "undefined" && thread["adminUpdate"] == false) return;

  try {
    let dataThread = (await getData(threadID))?.threadInfo || { 
      nicknames: {}, 
      adminIDs: [] // Ensure `adminIDs` is initialized as an empty array
    };

    switch (logMessageType) {
      // Handling admin changes (added or removed)
      case "log:thread-admins": {
        if (logMessageData.ADMIN_EVENT == "add_admin") {
          // Admin added
          dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
          if (global.configModule[this.config.name].sendNoti) {
            api.sendMessage(
              `»» NOTICE «« User ${logMessageData.TARGET_ID} has been promoted to admin ✅`,
              threadID, async (error, info) => {
                if (global.configModule[this.config.name].autoUnsend) {
                  await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                  return api.unsendMessage(info.messageID);
                }
              }
            );
          }
        } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
          // Admin removed
          dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id !== logMessageData.TARGET_ID);
          if (global.configModule[this.config.name].sendNoti) {
            api.sendMessage(
              `»» NOTICE «« User ${logMessageData.TARGET_ID} has been removed from admin ❌`,
              threadID, async (error, info) => {
                if (global.configModule[this.config.name].autoUnsend) {
                  await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                  return api.unsendMessage(info.messageID);
                }
              }
            );
          }
        }
        break;
      }

      // Handling thread icon update
      case "log:thread-icon": {
        let preIcon = JSON.parse(fs.readFileSync(iconPath));
        dataThread.threadIcon = logMessageData.thread_icon || "👍";
        if (global.configModule[this.config.name].sendNoti) {
          api.sendMessage(
            `» [ GROUP UPDATE ]\n» Group icon changed\n» Previous icon: ${preIcon[threadID] || "unknown"}`,
            threadID, async (error, info) => {
              preIcon[threadID] = dataThread.threadIcon;
              fs.writeFileSync(iconPath, JSON.stringify(preIcon));
              if (global.configModule[this.config.name].autoUnsend) {
                await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }

      // Handling thread color update
      case "log:thread-color": {
        dataThread.threadColor = logMessageData.thread_color || "🌤";
        if (global.configModule[this.config.name].sendNoti) {
          api.sendMessage(
            `» [ GROUP UPDATE ]\n» Group color changed`,
            threadID, async (error, info) => {
              if (global.configModule[this.config.name].autoUnsend) {
                await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }

      // Handling nickname update
      case "log:user-nickname": {
        dataThread.nicknames[logMessageData.participant_id] = logMessageData.nickname;
        if (global.configModule[this.config.name].sendNoti) {
          api.sendMessage(
            `»» NOTICE «« User ${logMessageData.participant_id} changed nickname to: ${(logMessageData.nickname.length == 0) ? "original name" : logMessageData.nickname}`,
            threadID, async (error, info) => {
              if (global.configModule[this.config.name].autoUnsend) {
                await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }

      // Handling thread name update
      case "log:thread-name": {
        dataThread.threadName = logMessageData.name || "No name";
        if (global.configModule[this.config.name].sendNoti) {
          api.sendMessage(
            `»» NOTICE «« The group name has been updated to: ${dataThread.threadName}`,
            threadID, async (error, info) => {
              if (global.configModule[this.config.name].autoUnsend) {
                await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }
    }

    // Save the updated thread info to the database
    await setData(threadID, { threadInfo: dataThread });
  } catch (e) {
    console.log(e);
  }
};
