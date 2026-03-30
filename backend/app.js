const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const requestRoutes = require('./src/routes/requestRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Setup upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.use(upload.single('image'));
app.use('/uploads', express.static(uploadDir));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => {
  res.send("HireHelper API Running");
});

// 404 Handler - Route not found
app.use((req, res) => {
  console.warn(`❌ [404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    available_endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/verify-otp',
        'POST /api/auth/resend-otp',
        'POST /api/auth/forgot-password',
        'POST /api/auth/verify-password-reset-otp',
        'POST /api/auth/reset-password'
      ],
      profile: [
        'GET /api/profile/me',
        'PUT /api/profile/update',
        'PUT /api/profile/change-password',
        'POST /api/profile/upload-picture',
        'DELETE /api/profile/picture'
      ],
      activity: [
        'GET /api/activity',
        'GET /api/activity/dashboard',
        'GET /api/activity/recent',
        'GET /api/activity/timeline'
      ],
      settings: [
        'GET /api/settings',
        'PUT /api/settings/notifications',
        'PUT /api/settings/theme',
        'PUT /api/settings/language',
        'PUT /api/settings/privacy',
        'PUT /api/settings/change-password',
        'DELETE /api/settings/delete-account'
      ],
      tasks: [
        'GET /api/tasks',
        'GET /api/tasks/my-tasks',
        'GET /api/tasks/:taskId',
        'POST /api/tasks',
        'PUT /api/tasks/:taskId',
        'DELETE /api/tasks/:taskId'
      ],
      notifications: [
        'GET /api/notifications',
        'GET /api/notifications/unread-count',
        'PUT /api/notifications/read/:id',
        'POST /api/notifications/create'
      ],
      users: [
        'GET /api/users',
        'GET /api/users/:userId',
        'GET /api/users/search'
      ]
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ [Error]', err.message);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = app;