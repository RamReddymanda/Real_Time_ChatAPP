const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const recentChatsRoutes = require('./routes/recentChats');
// import keyRoutes from './routes/keyRoutes.js';
const keyRoutes =require('./routes/keys')
const Message = require('./models/Message');
const app = express();
const server = http.createServer(app);
const updateRecentChat = require('./middlewares/UpdateRecentChats');
const dotenv = require('dotenv');
const { timeStamp } = require('console');
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
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/keys', keyRoutes);
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
    Message.find({ to: username, delivered: false })
      .then(messages => {
        messages.forEach(msg => {
          io.to(socket.id).emit('private-message', {from:msg.from, payload: msg.payload, timestamp: msg.timestamp });
          msg.delivered = true;
          msg.save();
        });
      });
    io.emit('online-users', Array.from(users));
  });
  socket.on('typing', ({ to }) => {
    console.log("tyoing",to,socket.username)
    const targetSocketId = users.get(to);

    if (targetSocketId) {
      console.log("emitting",targetSocketId)
      io.to(targetSocketId).emit('typing', { from: socket.username });
    }
  });

  socket.on('stopped-typing', ({ to }) => {
    const targetSocketId = users.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('stopped-typing', { from: socket.username });
    }
  });
  // socket.on('send-message', (data) => {
  //   console.log(`📩 Broadcast from ${data.from}: ${data.text}`);

  //   socket.broadcast.emit('receive-message', data);

  // });
  socket.on('private-message',async({to,from,timestamp,payload})=>{
    // const from =socket.username
    console.log("private msg",to,from,payload)
    const targetSocketId = users.get(to);
    if (targetSocketId){
      io.to(targetSocketId).emit('private-message', {from , payload ,timestamp});
    }
    else{
      const messages = new Message({ from, to,payload, timestamp });
       await messages.save();
    }
    updateRecentChat(from, to);
     updateRecentChat(to, from); 
  })
  socket.on('send-private-message', async({ receiver, sender, message, timestamp }) => {
    const from = sender;
    const to = receiver;
    const text = message;
    const time = timestamp;
    const targetSocketId = users.get(receiver);
   console.log(receiver,message,targetSocketId)
    
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
    socket.on('call-user', ({ to, offer, callType }) => {
    const target = users.get(to);
    if (target) {
      io.to(target).emit('incoming-call', {
        from: socket.username,
        offer,
        callType, // forward this to receiver
        });
      }
    });
    socket.on('end-call', ({ to }) => {
      const target = users.get(to);
      if (target) {
        io.to(target).emit('call-ended');
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
server.listen(PORT,'0.0.0.0',() => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
