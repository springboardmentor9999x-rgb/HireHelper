const { Message } = require('../models/messageModel');
const { Request } = require('../models/requestModel');
const { Task } = require('../models/taskModel');
const { Notification } = require('../models/notificationModel');

const chatController = {
    sendMessage: async (req, res) => {
        try {
            const { request_id, content } = req.body;
            const sender_id = req.user.id; // From auth middleware

            if (!request_id || !content) {
                return res.status(400).json({ success: false, message: 'Request ID and content are required' });
            }

            if (content.length > 5000) {
                return res.status(400).json({ success: false, message: 'Message is too long (max 5000 chars)' });
            }

            // Verify the user is part of the chat (either the helper who made the request or the task owner)
            const request = await Request.findByUserId(sender_id); // This finds requests MADE BY the user
            const isHelper = request.some(r => r.id === parseInt(request_id));

            // Check if user is the task owner
            const ownerRequests = await Request.findByTaskOwnerId(sender_id);
            const isOwner = ownerRequests.some(r => r.id === parseInt(request_id));

            if (!isHelper && !isOwner) {
                return res.status(403).json({ success: false, message: 'You are not authorized to send messages in this chat' });
            }

            const newMessage = await Message.create({ request_id, sender_id, content });
            
            // Get sender name for real-time update
            const messages = await Message.findByRequestId(request_id);
            const latestMessage = messages.find(m => m.id === newMessage.id);

            // Emit to the room
            const io = req.app.get('socketio');
            io.to(`chat_${request_id}`).emit('new_message', latestMessage);

            // Notify recipient
            const currentRequest = await Request.findById(request_id);
            if (currentRequest) {
                const recipientId = sender_id === currentRequest.user_id ? currentRequest.owner_id : currentRequest.user_id;
                
                // Create DB notification
                const notification = await Notification.create(
                    recipientId,
                    `New message from ${latestMessage.sender_name}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
                    'chat_message',
                    request_id
                );

                // Emit real-time notification to recipient
                io.to(`user_${recipientId}`).emit('new_notification', notification);
            }
            
            res.status(201).json({ success: true, message: latestMessage });
        } catch (err) {
            console.error('Error sending message:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    getChatHistory: async (req, res) => {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            // Authorization check
            const helperRequests = await Request.findByUserId(userId);
            const isHelper = helperRequests.some(r => r.id === parseInt(requestId));

            const ownerRequests = await Request.findByTaskOwnerId(userId);
            const isOwner = ownerRequests.some(r => r.id === parseInt(requestId));

            if (!isHelper && !isOwner) {
                return res.status(403).json({ success: false, message: 'You are not authorized to view this chat' });
            }

            const messages = await Message.findByRequestId(requestId);
            
            // Mark as read when history is fetched
            await Message.markAsRead(requestId, userId);
            
            res.status(200).json({ success: true, messages });
        } catch (err) {
            console.error('Error fetching chat history:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            await Message.markAsRead(requestId, userId);
            
            // Notify other user via socket that messages were read (optional but good for blue ticks)
            const io = req.app.get('socketio');
            io.to(`chat_${requestId}`).emit('messages_read', { requestId, userId });

            res.status(200).json({ success: true });
        } catch (err) {
            console.error('Error marking messages as read:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = chatController;
