// routes/keyRoutes.js
const express = require('express');
// import Key from '../models/Key.js';
const Key= require('../models/Key.js')
const User = require('../models/User.js');
const router = express.Router();
/**
 * Find userId by phone number and attach to req object.
 * Expects phone number as req.query.phone or req.body.phone.
 */
// POST /keys/upload
router.post('/upload', async (req, res) => {
  const { userId, publicKey } = req.body;
 await Key.updateOne(
    { userId },
    { $set: {publicKey } },
    { upsert: true }
  );
  res.send({ success: true });
});

// GET /keys/:userId
router.get('/:userId', async (req, res) => {
  const userKeys = await Key.findOne({ userId: req.params.userId });
  console.log(userKeys)
  res.send(userKeys);
});



module.exports =router;