import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import requestRoutes from './routes/requestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { errorHandler } from './middleware/errorHandler';
import migrate from './config/migrate';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Error Handler
app.use(errorHandler);

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    // Run DB migrations
    await migrate();
});

export default app;
