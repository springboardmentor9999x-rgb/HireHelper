const { Request } = require('../models/requestModel');
const { Task } = require('../models/taskModel');
const { Notification } = require('../models/notificationModel');
exports.createRequest = async (req, res) => {
    const { task_id, message } = req.body;
    const user_id = req.user.id;

    if (!task_id) {
        return res.status(400).json({ success: false, message: 'Task ID is required' });
    }

    try {
        const existing = await Request.findExistingRequest(user_id, task_id);
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already requested this task' });
        }

        const task = await Task.findById(task_id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        if (task.user_id === user_id) {
             return res.status(400).json({ success: false, message: 'You cannot request your own task' });
        }

        const request = await Request.create({ user_id, task_id, message });
        
        const notification = await Notification.create(
            task.user_id,
            `Someone requested to help with your task: "${task.title}"`,
            'request_received',
            request.id
        );

        // Emit real-time notification to the task owner
        const io = req.app.get('socketio');
        if (io) {
            io.to(`user_${task.user_id}`).emit('new_notification', notification);
        }

        return res.status(201).json({ success: true, request });
    } catch (err) {
        console.error('Create request error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while creating request' });
    }
};

exports.getMyRequests = async (req, res) => {
    const user_id = req.user.id;

    try {
        const requests = await Request.findByUserId(user_id);
        return res.json({ success: true, requests });
    } catch (err) {
        console.error('Get my requests error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching requests' });
    }
};

exports.getRequestsForTask = async (req, res) => {
    const { taskId } = req.params;

    try {
        const requests = await Request.findByTaskId(taskId);
        return res.json({ success: true, requests });
    } catch (err) {
        console.error('Get task requests error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching task requests' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    try {
        const updatedRequest = await Request.updateStatus(id, status);
        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const task = await Task.findById(updatedRequest.task_id);

        if (status === 'ACCEPTED') {
            await Task.updateStatus(updatedRequest.task_id, 'ASSIGNED');
            
            const notification = await Notification.create(
                updatedRequest.user_id,
                `Your request has been accepted for task: "${task.title}". You are now assigned!`,
                'request_accepted',
                updatedRequest.id
            );

            // Emit real-time notification to the requester
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${updatedRequest.user_id}`).emit('new_notification', notification);
            }
        } else if (status === 'REJECTED') {
             const notification = await Notification.create(
                updatedRequest.user_id,
                `Your request was rejected for task: "${task.title}".`,
                'request_rejected',
                updatedRequest.id
            );

            // Emit real-time notification to the requester
            const io = req.app.get('socketio');
            if (io) {
                io.to(`user_${updatedRequest.user_id}`).emit('new_notification', notification);
            }
        }

        return res.json({ success: true, request: updatedRequest });
    } catch (err) {
        console.error('Update request status error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while updating request status' });
    }
};

exports.getIncomingRequests = async (req, res) => {
    const user_id = req.user.id;

    try {
        const requests = await Request.findByTaskOwnerId(user_id);
        return res.json({ success: true, requests });
    } catch (err) {
        console.error('Get incoming requests error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching incoming requests' });
    }
};
