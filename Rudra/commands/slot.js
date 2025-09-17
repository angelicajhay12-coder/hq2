const { getData, setData } = require("../../database.js");

// Slot symbols
const symbols = ["🍒", "🍋", "🍇", "🍀", "⭐", "💎"];

module.exports.config = {
  name: "slot",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "ChatGPT + Firebase refactor",
  description: "Play slot machine with coins",
  commandCategory: "Games",
  usages: "/slot <amount>",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, senderID } = event;

  // ✅ Fetch user balance from the database (bank account)
  let userBank = (await getData(`/bank/${senderID}`)) || { balance: 0 };

  const bet = parseInt(args[0]);
  if (isNaN(bet) || bet <= 0) {
    return api.sendMessage("❌ Usage: /slot <bet>", threadID);
  }

  if (userBank.balance < bet) {
    return api.sendMessage("⚠️ You don't have enough coins!", threadID);
  }

  // Deduct the bet from the balance
  userBank.balance -= bet;

  // Roll the slot machine
  const roll = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  let resultMsg = `🎰 SLOT MACHINE 🎰\n[ ${roll.join(" | ")} ]\n\n`;

  // Check the result and calculate winnings
  if (roll[0] === roll[1] && roll[1] === roll[2]) {
    const win = bet * 5;
    userBank.balance += win;
    resultMsg += `✨ JACKPOT! 3 in a row! You won 💰 ${win.toLocaleString()} coins.`;
  } else if (roll[0] === roll[1] || roll[1] === roll[2] || roll[0] === roll[2]) {
    const win = bet * 2;
    userBank.balance += win;
    resultMsg += `✅ 2 matches! You won 💰 ${win.toLocaleString()} coins.`;
  } else {
    resultMsg += `❌ You lost your bet of 💰 ${bet.toLocaleString()}.`;
  }

  // Fetch username for the player (this part was missing in your original code)
  let userName = await Users.getNameUser(senderID);

  // Update the balance and name in the database
  await setData(`/bank/${senderID}`, {
    balance: userBank.balance,
    name: userName, // Save the username in the database
  });

  // Add the final balance to the result message
  resultMsg += `\n\n👤 ${userName}\n💳 Balance: ${userBank.balance.toLocaleString()} coins`;

  return api.sendMessage(resultMsg, threadID);
};
