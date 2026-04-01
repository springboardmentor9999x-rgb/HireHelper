require('dotenv').config();
const express = require('express'); // 🔥 ADD THIS
const app = require('./src/app');
require('./src/config/db');

const PORT = process.env.PORT || 5000;

app.use('/uploads', express.static('uploads'));
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));
app.use('/api/tasks', require('./src/routes/task.routes'));
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});