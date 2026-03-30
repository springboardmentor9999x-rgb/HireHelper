const { Task } = require('../models/taskModel');
const { Notification } = require('../models/notificationModel');

exports.addTask = async (req, res) => {
    console.log('--- addTask called ---');
    try {
        const { title, description, location, start_time, end_time, picture_url, pay } = req.body;
        const user_id = req.user.id;
        console.log('User ID from token:', user_id);

        // Validation
        if (!title || !description || !location || !start_time || !picture_url) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Title, description, location, start time, and picture URL are required.'
            });
        }

        if (title.length > 100) return res.status(400).json({ success: false, message: 'Title is too long (max 100 chars)' });
        if (description.length > 2000) return res.status(400).json({ success: false, message: 'Description is too long (max 2000 chars)' });
        if (location.length > 200) return res.status(400).json({ success: false, message: 'Location is too long (max 200 chars)' });

        console.log('Calling Task.create...');
        const newTask = await Task.create({
            user_id,
            title,
            description,
            location,
            start_time,
            end_time: end_time || null,   // empty string → null for TIMESTAMPTZ
            picture_url,
            pay: pay || 0
        });
        console.log('Task created successfully:', newTask.id);

        try {
            const notification = await Notification.create(
                user_id,
                `Your task "${title}" was created successfully!`,
                'task_created',
                newTask.id
            );

            // Emit real-time notification
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${user_id}`).emit('new_notification', notification);
            }
        } catch (notifErr) {
            console.error('Failed to create task socket notification (non-fatal):', notifErr.message);
        }

        console.log('Sending 201 response for addTask');
        return res.status(201).json({
            success: true,
            task: newTask
        });
    } catch (err) {
        console.error('Add task error:', err.message);
        console.error('Error code:', err.code);
        console.error('Error detail:', err.detail);
        console.error('Request body was:', JSON.stringify(req.body));
        return res.status(500).json({
            success: false,
            message: 'Server error while creating task.'
        });
    }
};

exports.getMyTasks = async (req, res) => {
    const userId = req.user?.id;
    console.log('--- getMyTasks called for user:', userId);
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        const tasks = await Task.findByUserId(userId);
        console.log(`[DEBUG] getMyTasks: user_id=${req.user.id}, found=${tasks.length} tasks`);
        return res.json({
            success: true,
            tasks
        });
    } catch (err) {
        console.error('Get my tasks error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching your tasks.'
        });
    }
};

exports.getFeed = async (req, res) => {
    const userId = req.user?.id;
    console.log('--- getFeed called for user:', userId);

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        const tasks = await Task.getFeed(userId);
        console.log(`[DEBUG] getFeed: exclude_user_id=${req.user.id}, found=${tasks.length} tasks`);
        return res.json({
            success: true,
            tasks
        });
    } catch (err) {
        console.error('Get feed error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching feed.'
        });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { title, description, location, start_time, end_time, picture_url, pay, status } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'You can only edit your own tasks' });
        }

        if (!title || !description || !location || !start_time || !picture_url) {
            return res.status(400).json({ success: false, message: 'All fields including picture URL are required' });
        }

        const updatedTask = await Task.update(id, {
            title, description, location, start_time,
            end_time: end_time || null,
            picture_url,
            pay: pay || 0,
            status
        });

        return res.json({ success: true, task: updatedTask });
    } catch (err) {
        console.error('Update task error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while updating task' });
    }
};

exports.getTaskById = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        return res.json({ success: true, task });
    } catch (err) {
        console.error('Get task by id error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching task' });
    }
};

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own tasks' });
        }

        await Task.delete(id);
        return res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Delete task error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while deleting task' });
    }
};

exports.completeTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'You can only complete your own tasks' });
        }

        const updatedTask = await Task.updateStatus(id, 'COMPLETED');
        
        try {
            const notification = await Notification.create(
                userId,
                `Your task "${task.title}" has been marked as completed!`,
                'task_completed',
                id
            );

            // Emit real-time notification
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${userId}`).emit('new_notification', notification);
            }
        } catch (notifErr) {
            console.error('Failed to create completion socket notification (non-fatal):', notifErr.message);
        }

        return res.json({ success: true, task: updatedTask });
    } catch (err) {
        console.error('Complete task error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while completing task' });
    }
};
