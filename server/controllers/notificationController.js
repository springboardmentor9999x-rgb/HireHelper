const { Notification } = require('../models/notificationModel');

exports.getNotifications = async (req, res) => {
    const user_id = req.user.id;
    try {
        const notifications = await Notification.findByUserId(user_id);
        return res.json({ success: true, notifications });
    } catch (err) {
        console.error('Get notifications error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await Notification.markAsRead(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, notification });
    } catch (err) {
        console.error('Mark notification as read error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while updating notification' });
    }
};

exports.markAllAsRead = async (req, res) => {
     const user_id = req.user.id;
     try {
         await Notification.markAllAsRead(user_id);
         return res.json({ success: true, message: 'All notifications marked as read' });
     } catch (err) {
         console.error('Mark all notifications as read error:', err.message);
         return res.status(500).json({ success: false, message: 'Server error while updating notifications' });
     }
};
