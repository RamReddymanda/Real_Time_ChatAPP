const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: String, required: true },    // sender's username or phone
  to: { type: String, required: true },      // receiver's username or phone
  payload: { type:Object, required: true }, // E2EE payload
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false }, // To track if delivered
});

module.exports = mongoose.model('Message', MessageSchema);
