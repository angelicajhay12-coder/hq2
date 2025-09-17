const fs = global.nodemodule["fs-extra"];
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];

module.exports.config = {
  name: "resend",
  version: "2.1.0",
  hasPermssion: 1,
  credits: "Thọ & Mod By DuyVuong + ChatGPT",
  description: "Resends Messages with sender name",
  usePrefix: true,
  commandCategory: "general",
  usages: "resend",
  cooldowns: 0,
  hide: true,
  dependencies: { request: "", "fs-extra": "", axios: "" },
};

module.exports.handleEvent = async function ({ event, api, Users }) {
  let { messageID, senderID, threadID, body: content } = event;

  if (!global.logMessage) global.logMessage = new Map();
  if (!global.data.botID) global.data.botID = api.getCurrentUserID();

  // Skip messages from bot itself
  if (senderID == global.data.botID) return;

  // Fetch username (with cache)
  let name = global.data.userName.get(senderID);
  if (!name) {
    const userInfo = await api.getUserInfo(senderID);
    name = Object.values(userInfo)[0]?.name || "Friend";
    global.data.userName.set(senderID, name);
  }

  // Save message (non-unsend)
  if (event.type !== "message_unsend") {
    global.logMessage.set(messageID, {
      msgBody: content,
      attachment: event.attachments || [],
      senderName: name,
    });
  }

  // Handle unsend
  if (event.type === "message_unsend") {
    const getMsg = global.logMessage.get(messageID);
    if (!getMsg) return;

    const senderName = getMsg.senderName || "Friend";

    if (!getMsg.attachment || getMsg.attachment.length === 0) {
      return api.sendMessage(
        `${senderName} unsent a message.\n\nContent: ${getMsg.msgBody}`,
        threadID,
        null
      );
    } else {
      let num = 0;
      let msg = {
        body: `${senderName} unsent a message.\n${getMsg.attachment.length} Attachment(s)${
          getMsg.msgBody ? `\n\nContent: ${getMsg.msgBody}` : ""
        }`,
        attachment: [],
        mentions: [{ tag: senderName, id: senderID, fromIndex: 0 }],
      };

      for (let i of getMsg.attachment) {
        num += 1;
        const url = i.url;

        // Download the attachment (photo, file, etc.)
        const extension = url.split('.').pop();
        const pathFile = `${__dirname}/cache/resend_${num}.${extension}`;

        try {
          // Request the attachment from the URL
          const response = await axios.get(url, { responseType: "arraybuffer" });
          fs.writeFileSync(pathFile, response.data);

          // Add the attachment to the message
          msg.attachment.push(fs.createReadStream(pathFile));

          // Delete the file after sending
          msg.attachment[msg.attachment.length - 1].on("close", () => {
            if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile);
          });
        } catch (error) {
          console.error("❌ Error downloading attachment:", error);
        }
      }

      // Send the message with attachment
      api.sendMessage(msg, threadID, (err) => {
        if (err) console.error("❌ Error sending resend message:", err);
      });
    }
  }
};

module.exports.run = async function ({ api, event, Threads }) {
  const { threadID, messageID } = event;

  const data = (await Threads.getData(threadID)).data;

  if (typeof data["resend"] === "undefined" || data["resend"] === false) data["resend"] = true;
  else data["resend"] = false;

  await Threads.setData(parseInt(threadID), { data });
  global.data.threadData.set(parseInt(threadID), data);

  return api.sendMessage(
    `Resend feature is now ${data["resend"] ? "ON ✅" : "OFF ❌"} successfully!`,
    threadID,
    messageID
  );
};
