// models/Key.js
const mongoose=require('mongoose')
const KeySchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  publicKey: { type: String, required: true }, // base64
  // registrationId: { type: Number },
  // signedPreKey: {
  //   keyId: Number,
  //   pubKey: String,   // base64
  //   signature: String    // base64
  // },
  // preKeys: [
  //   {
  //     keyId: Number,
  //     pubKey: String  // base64
  //   }
  // ]
}, { timestamps: true });

module.exports=mongoose.model('Key', KeySchema);

