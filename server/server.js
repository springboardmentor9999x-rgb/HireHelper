require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const requestRoutes = require('./routes/requests');
const notificationRoutes = require('./routes/notifications');
const publicRoutes = require('./routes/public');
const chatRoutes = require('./routes/chat');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initTable } = require('./models/taskModel');
const { initRequestTable } = require('./models/requestModel');
const { initNotificationTable } = require('./models/notificationModel');
const { initMessageTable } = require('./models/messageModel');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to our routes
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('join_chat', (requestId) => {
    socket.join(`chat_${requestId}`);
    console.log(`👤 Socket ${socket.id} joined chat_${requestId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Socket ${socket.id} joined user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Secure HTTP headers

app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true
}));
app.use(express.json());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', globalLimiter);

// Stricter Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, // limit each IP to 20 auth attempts per 15 mins
  message: { success: false, message: 'Too many login/register attempts, please try again later' }
});
app.use('/api/auth/', authLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/tasks', taskRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HireHelper API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

async function startServer() {
  try {
    console.log('⏳ Initializing database tables...');
    await initTable();
    await initRequestTable();
    await initNotificationTable();
    await initMessageTable();
    await authRoutes.initAuthSchema(); // Handle this explicitly

    const serverInstance = server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

startServer();
