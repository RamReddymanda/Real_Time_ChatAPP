const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 1. Send OTP (simulated)
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const otp = '1234'; // Simulated OTP
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, otp });
    } else {
      user.otp = otp;
    }

    await user.save();
    console.log(`📲 OTP sent to ${phone}: ${otp}`);

    res.status(200).json({ message: 'OTP sent (simulated)' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone });

    if (user && String(user.otp) === String(otp)) {
      const token = jwt.sign({ phone }, 'secret', { expiresIn: '1h' });

      user.isVerified = true;
      user.otp = null;
      await user.save();

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
      });

      return res.status(200).json({ message: 'OTP verified', token, user });
    }

    return res.status(400).json({ error: 'Invalid OTP' });
  } catch (error) {
    console.error('OTP verification failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /api/auth/me
router.get('/me/:id', async (req, res) => {

  // const authHeader = req.headers.authorization;
  const token = req.params.id;
  // console.log(req.cookies.token)
console.log('Token received:', token);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'secret');
    const user = await User.findOne({ phone: decoded.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user, token });
  } catch (err) {
    console.error('Auth check failed:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
});



module.exports = router;
