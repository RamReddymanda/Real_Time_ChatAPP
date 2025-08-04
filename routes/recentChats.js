// routes/recentChats.js
const express = require('express');
const router = express.Router();
const RecentChat = require('../models/RecentChat');

// GET /api/recent-chats/:phone
router.get('/recent-chats/:phone', async (req, res) => {
  try {
    console.log('Fetching recent chats for phone:', req.params.phone);
    const recent = await RecentChat.findOne({ userPhone: req.params.phone }).lean();

    if (!recent) return res.json([]);

    const sortedContacts = recent.contacts.sort(
      (a, b) => new Date(b.lastContactTime) - new Date(a.lastContactTime)
    );

    res.json(sortedContacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
