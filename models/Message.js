const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },    // sender's username or phone
  receiver: { type: String, required: true },      // receiver's username or phone
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false }, // To track if delivered
});

module.exports = mongoose.model('Message', MessageSchema);
