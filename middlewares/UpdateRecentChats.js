const RecentChat = require('../models/RecentChat');

async function updateRecentChat(senderPhone, receiverPhone) {
  const user = await RecentChat.findOne({ userPhone: senderPhone });
  console.log("jos",user)
  if (user) {
    const contactIndex = user.contacts.findIndex(c => c.phone === receiverPhone);
    
    if (contactIndex !== -1) {
      user.contacts[contactIndex].lastContactTime = new Date();
    } else {
      user.contacts.push({
        phone: receiverPhone,
        lastContactTime: new Date(),
      });
    }

    await user.save();
  } else {
    await RecentChat.create({
      userPhone: senderPhone,
      contacts: [{ phone: receiverPhone }],
    });
  }
}
module.exports = updateRecentChat;