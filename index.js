const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const recentChatsRoutes = require('./routes/recentChats');
const Message = require('./models/Message');
const app = express();
const server = http.createServer(app);
const updateRecentChat = require('./middlewares/UpdateRecentChats');
const dotenv = require('dotenv');
dotenv.config();
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL ,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', recentChatsRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to the Chat Server');
});

// MongoDB connection
mongoose.connect(process.env.ATLASDB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));


// Use Map for cleaner management
const users = new Map(); // username -> socket.id

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`💬 User connected: ${socket.id}`);

  socket.on('set-username', (username) => {
    if (!username) return;

    // Store mapping
    socket.username = username;
    users.set(username, socket.id);
    console.log(users)
    // Send undelivered messages
    Message.find({ receiver: username, delivered: false })
      .then(messages => {
        messages.forEach(msg => {
          io.to(socket.id).emit('receive-private-message', msg);
          msg.delivered = true;
          msg.save();
        });
      });

    // console.log(`👤 ${username} is online`);
    io.emit('online-users', Array.from(users));
  });

  socket.on('send-message', (data) => {
    console.log(`📩 Broadcast from ${data.from}: ${data.text}`);
    socket.broadcast.emit('receive-message', data);
  });

  socket.on('send-private-message', async({ receiver, sender, message, timestamp }) => {
    const from = sender;
    const to = receiver;
    const text = message;
    const time = timestamp;
    const targetSocketId = users.get(receiver);
   
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-private-message', { sender, message, timestamp });
    }
    else{
      const messages = new Message({ sender, receiver, message, timestamp });
       await messages.save();
    }
    // Update recent chats
      updateRecentChat(from, to);
      updateRecentChat(to, from); 
  });
      socket.on('call-user', ({ to, offer }) => {
      const target = users.get(to);
      console.log(`📞 Call from ${socket.username} to ${to}`);
      if (target) {
        io.to(target).emit('incoming-call', { from: socket.username, offer });
      }
    });

    socket.on('answer-call', ({ to, answer }) => {
      const target = users.get(to);
      if (target) {
        io.to(target).emit('call-accepted', { from: socket.username, answer });
      }
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      const target = users.get(to);
      if (target) {
        io.to(target).emit('ice-candidate', { from: socket.username, candidate });
      }
    });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    
    // Remove user from map
    if (socket.username && users.has(socket.username)) {
      users.delete(socket.username);
      console.log(`🗑️ Removed ${socket.username}`);
    }
    console.log("ji",users)
    io.emit('online-users', Array.from(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,() => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
