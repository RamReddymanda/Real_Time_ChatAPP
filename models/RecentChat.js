const mongoose = require('mongoose');

const recentChatSchema = new mongoose.Schema({
  userPhone: {
    type: String,
    required: true,
    index: true,
  },
  contacts: [
    {
      phone: {
        type: String,
        required: true,
      },
      lastContactTime: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('RecentChat', recentChatSchema);
