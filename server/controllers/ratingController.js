const pool = require('../config/db');
const { Notification } = require('../models/notificationModel');

exports.submitRating = async (req, res) => {
    const { taskId, score, comment } = req.body;
    const raterId = req.user.id;

    if (!taskId || !score) {
        return res.status(400).json({ success: false, message: 'Task ID and score are required' });
    }

    if (score < 1 || score > 5) {
        return res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
    }

    try {
        // 1. Verify task exists, is COMPLETED, and rater is the owner
        const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskResult.rows[0];

        if (task.user_id !== raterId) {
            return res.status(403).json({ success: false, message: 'Only the task owner can rate the helper' });
        }

        if (task.status?.toUpperCase() !== 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Ratings can only be submitted for completed tasks' });
        }

        // 2. Find the helper (user with ACCEPTED request)
        const requestResult = await pool.query(
            "SELECT user_id FROM requests WHERE task_id = $1 AND status = 'ACCEPTED' LIMIT 1",
            [taskId]
        );
        if (requestResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'No helper found for this task' });
        }
        const rateeId = requestResult.rows[0].user_id;

        // 3. Check if already rated
        const existingRating = await pool.query(
            'SELECT id FROM ratings WHERE task_id = $1 AND rater_id = $2',
            [taskId, raterId]
        );
        if (existingRating.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already rated this task' });
        }

        // 4. Insert rating
        await pool.query(
            `INSERT INTO ratings (task_id, rater_id, ratee_id, score, comment)
             VALUES ($1, $2, $3, $4, $5)`,
            [taskId, raterId, rateeId, score, comment]
        );

        // 5. Update ratee aggregates
        await pool.query(
            `UPDATE users 
             SET rating_avg = (rating_avg * rating_count + $1) / (rating_count + 1),
                 rating_count = rating_count + 1
             WHERE id = $2`,
            [score, rateeId]
        );

        // 6. Notify helper
        try {
            const notification = await Notification.create(
                rateeId,
                `The hirer has rated you ${score} stars for task: "${task.title}"`,
                'task_rated',
                taskId
            );
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${rateeId}`).emit('new_notification', notification);
            }
        } catch (notifErr) {
            console.error('Rating notification error:', notifErr.message);
        }

        return res.status(201).json({ success: true, message: 'Rating submitted successfully' });
    } catch (err) {
        console.error('Submit rating error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while submitting rating' });
    }
};
