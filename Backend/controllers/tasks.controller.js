const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

exports.createTask = async (req, res) => {
  const { title, description, location, start_time, end_time, pay } = req.body;
  let picture = req.body.picture || null;
  const user_id = req.user.id;

  if (req.file) {
      picture = `/uploads/${req.file.filename}`;
  }

  if (!title) {
    return res.status(400).json({ msg: 'Title is required' });
  }

  try {
    const newTaskResult = await pool.query(
      `INSERT INTO task (user_id, title, description, location, start_time, end_time, picture, pay, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') RETURNING *`,
      [user_id, title, description, location, start_time || null, end_time || null, picture || null, pay || null]
    );

    res.status(201).json({ msg: 'Task created successfully', task: newTaskResult.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMyTasks = async (req, res) => {
  const user_id = req.user.id;

  try {
    const tasksResult = await pool.query(
      'SELECT * FROM task WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    res.json(tasksResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateTask = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { title, description, location, start_time, end_time, pay } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    const result = await pool.query(
      `UPDATE task SET title = $1, description = $2, location = $3, start_time = $4, end_time = $5, pay = $6 WHERE id = $7 RETURNING *`,
      [title, description || null, location || null, start_time || null, end_time || null, pay || null, id]
    );

    res.json({ msg: 'Task updated', task: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTask = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    await pool.query('DELETE FROM task WHERE id = $1', [id]);
    res.json({ msg: 'Task deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getFeedTasks = async (req, res) => {
  const user_id = req.user.id;

  try {
    const feedResult = await pool.query(
      `SELECT t.*, u.first_name, u.last_name, u.profile_picture as user_picture,
              EXISTS(SELECT 1 FROM requests r WHERE r.task_id = t.id AND r.requester_id = $1) as applied
       FROM task t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id != $1
       ORDER BY t.created_at DESC`,
      [user_id]
    );

    res.json(feedResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a help request for a task
exports.requestTask = async (req, res) => {
  const requester_id = req.user.id;
  const { task_id, message } = req.body;

  if (!task_id) {
    return res.status(400).json({ msg: 'task_id is required' });
  }

  try {
    // Make sure user doesn't request their own task
    const taskCheck = await pool.query('SELECT user_id FROM task WHERE id = $1', [task_id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    if (taskCheck.rows[0].user_id === requester_id) {
      return res.status(400).json({ msg: 'You cannot request your own task' });
    }

    // Check if already requested
    const existing = await pool.query(
      'SELECT id FROM requests WHERE task_id = $1 AND requester_id = $2',
      [task_id, requester_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ msg: 'You have already requested this task' });
    }

    const result = await pool.query(
      `INSERT INTO requests (task_id, requester_id, status, message) VALUES ($1, $2, 'pending', $3) RETURNING *`,
      [task_id, requester_id, message || null]
    );

    // Get owner email and preferences to notify them
    let ownerInfo;
    try {
      ownerInfo = await pool.query(
        `SELECT u.email_id, u.first_name, u.email_notifications, t.title 
         FROM task t JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
        [task_id]
      );
      if (ownerInfo.rows.length > 0) {
        const owner = ownerInfo.rows[0];
        if (owner.email_notifications) {
          const sendEmail = require('../utils/email');
          await sendEmail({
            email: owner.email_id,
            subject: 'New Help Offer for your Task!',
            html: `Hi ${owner.first_name},<br><br>Someone has just requested to help with your task "${owner.title}".<br>Log in to your dashboard to review their offer and message.<br><br>Best,<br>HireHelper Team`
          });
        }
      }
    } catch (emailErr) {
      console.error('Error sending application email:', emailErr);
    }

    // Create Notification
    try {
      const taskTitle = ownerInfo && ownerInfo.rows.length > 0 ? ownerInfo.rows[0].title : 'your task';
      const userRes = await pool.query('SELECT first_name FROM users WHERE id = $1', [requester_id]);
      const reqName = userRes.rows.length > 0 ? userRes.rows[0].first_name : 'Someone';

      await pool.query(
        `INSERT INTO notification (user_id, body, link) VALUES ($1, $2, $3)`,
        [taskCheck.rows[0].user_id, `${reqName} requested to help with "${taskTitle}".`, '/dashboard/requests']
      );
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(201).json({ msg: 'Request sent successfully', request: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get incoming requests (for my tasks — someone asked to help me)
exports.getIncomingRequests = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.id as request_id, r.status as request_status, r.created_at as requested_at, r.message, r.reply_message,
              t.id as task_id, t.title, t.description, t.location, t.pay, t.status as task_status,
              u.id as requester_user_id, u.first_name, u.last_name, u.email_id, u.profile_picture as requester_picture
       FROM requests r
       JOIN task t ON r.task_id = t.id
       JOIN users u ON r.requester_id = u.id
       WHERE t.user_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get my applied tasks (tasks I requested to help with)
exports.getMyAppliedTasks = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.id as request_id, r.status as request_status, r.created_at as requested_at, r.message, r.reply_message,
              t.id as task_id, t.title, t.description, t.location, t.pay, t.status as task_status, t.created_at as task_created_at,
              u.id as owner_user_id, u.first_name as owner_first_name, u.last_name as owner_last_name, u.profile_picture as owner_picture
       FROM requests r
       JOIN task t ON r.task_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE r.requester_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Accept or reject a request
exports.updateRequestStatus = async (req, res) => {
  const user_id = req.user.id;
  const { request_id } = req.params;
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Status must be accepted or rejected' });
  }

  try {
    // Make sure this request belongs to a task owned by the current user
    const check = await pool.query(
      `SELECT r.id, r.task_id, r.requester_id, t.user_id as task_owner_id, t.title, u.email_id as requester_email, u.email_notifications
       FROM requests r
       JOIN task t ON r.task_id = t.id
       JOIN users u ON r.requester_id = u.id
       WHERE r.id = $1`,
      [request_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    const row = check.rows[0];
    if (row.task_owner_id !== user_id) {
      return res.status(403).json({ msg: 'You do not own this task' });
    }

    const result = await pool.query(
      'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, request_id]
    );

    if (status === 'accepted') {
      // 1. Assign the task
      await pool.query("UPDATE task SET status = 'closed' WHERE id = $1", [row.task_id]);

      // 2. Reject other requests for the same task
      await pool.query("UPDATE requests SET status = 'rejected' WHERE task_id = $1 AND id != $2 AND status = 'pending'", [row.task_id, request_id]);
    }

    // 3. Send email to requester based on notification settings
    if (row.email_notifications) {
      try {
        const sendEmail = require('../utils/email');
        if (status === 'accepted') {
          await sendEmail({
             email: row.requester_email,
             subject: 'Your Request to Help was Accepted!',
             html: `Good news! Your request to help with the task "${row.title}" has been accepted. The task is now marked as closed.`
          });
        } else if (status === 'rejected') {
          await sendEmail({
             email: row.requester_email,
             subject: 'Update on your Request to Help',
             html: `Your offer to help with the task "${row.title}" has been declined by the owner.`
          });
        }
      } catch (emailErr) {
        console.error('Error sending status email:', emailErr);
      }
    }

    // 4. Create Notification
    try {
      let messageBody = '';
      if (status === 'accepted') {
        messageBody = `Your request to help with "${row.title}" has been accepted!`;
      } else if (status === 'rejected') {
        messageBody = `Your offer to help with "${row.title}" has been declined.`;
      }
      if (messageBody) {
        await pool.query(
          `INSERT INTO notification (user_id, body, link) VALUES ($1, $2, $3)`,
          [row.requester_id, messageBody, '/dashboard/my-requests']
        );
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.json({ msg: `Request ${status}`, request: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Toggle task status
exports.toggleTaskStatus = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    const result = await pool.query(
      'UPDATE task SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ msg: 'Task status updated', task: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Reply to a request via email & append to conversation
exports.replyToRequest = async (req, res) => {
  const user_id = req.user.id;
  const { request_id } = req.params;
  const { reply_message } = req.body;

  if (!reply_message) {
    return res.status(400).json({ msg: 'Reply message is required' });
  }

  try {
    const check = await pool.query(
      `SELECT r.id, r.message, r.reply_message, r.requester_id, t.user_id as task_owner_id, 
              t.title, u.email_id as requester_email, u.first_name as requester_name, u.email_notifications as requester_notif,
              o.first_name as owner_name, o.email_id as owner_email, o.email_notifications as owner_notif
       FROM requests r
       JOIN task t ON r.task_id = t.id
       JOIN users u ON r.requester_id = u.id
       JOIN users o ON t.user_id = o.id
       WHERE r.id = $1`,
      [request_id]
    );

    if (check.rows.length === 0) return res.status(404).json({ msg: 'Request not found' });
    const row = check.rows[0];

    let senderName = '';
    let recipientEmail = '';
    let notifyFlag = false;
    let recipientName = '';

    if (user_id === row.task_owner_id) {
      // Owner is replying
      senderName = row.owner_name + " (Owner)";
      recipientEmail = row.requester_email;
      recipientName = row.requester_name;
      notifyFlag = row.requester_notif !== false;
    } else if (user_id === row.requester_id) {
      // Requester is replying
      senderName = row.requester_name;
      recipientEmail = row.owner_email;
      recipientName = row.owner_name;
      notifyFlag = row.owner_notif !== false;
    } else {
      return res.status(403).json({ msg: 'Not authorized to reply to this request' });
    }

    // Append to conversation payload as a JSON array
    let conversation = [];
    if (row.reply_message) {
      try {
        conversation = JSON.parse(row.reply_message);
      } catch (e) {
        // Fallback if it's legacy text
        conversation = [{ sender: 'Unknown', timestamp: new Date().toISOString(), text: row.reply_message }];
      }
    }

    const timestamp = new Date().toISOString();
    conversation.push({ sender: senderName, timestamp, text: reply_message, read: false, sender_id: user_id });

    const updatedConversation = JSON.stringify(conversation);

    await pool.query('UPDATE requests SET reply_message = $1 WHERE id = $2', [updatedConversation, request_id]);

    // Send email only if notifications are enabled
    if (notifyFlag) {
      try {
        const sendEmail = require('../utils/email');
        await sendEmail({
          email: recipientEmail,
          subject: `New Reply regarding task: "${row.title}"`,
          html: `Hi ${recipientName},<br><br>${senderName} has sent a new message regarding the task "${row.title}":<br><br>"${reply_message}"<br><br>Log in to your dashboard to view the conversation and reply back!`
        });
      } catch (err) {
        console.error('Error sending conversation email:', err);
      }
    }

    res.json({ msg: 'Reply sent successfully', updatedConversation });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Edit a task
exports.updateTask = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { title, description, location, pay, start_time, end_time } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    const result = await pool.query(
      `UPDATE task 
       SET title = $1, description = $2, location = $3, pay = $4, start_time = $5, end_time = $6
       WHERE id = $7 RETURNING *`,
      [title, description, location, pay, start_time || null, end_time || null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    await pool.query('DELETE FROM task WHERE id = $1', [id]);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Toggle Task Status (Open/Closed)
exports.toggleTaskStatus = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM task WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Task not found' });
    if (check.rows[0].user_id !== user_id) return res.status(403).json({ msg: 'Not authorized' });

    const result = await pool.query(
      'UPDATE task SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markMessagesAsRead = async (req, res) => {
  const user_id = req.user.id;
  const { request_id } = req.params;
  
  try {
    const check = await pool.query('SELECT reply_message FROM requests WHERE id = $1', [request_id]);
    if (check.rows.length === 0) return res.status(404).json({ msg: 'Request not found' });
    
    let conversation = [];
    if (check.rows[0].reply_message) {
      try { conversation = JSON.parse(check.rows[0].reply_message); } catch(e) {}
    }
    
    let updated = false;
    conversation.forEach(msg => {
      if (msg.sender_id !== user_id && msg.read === false) {
        msg.read = true;
        updated = true;
      }
    });
    
    if (updated) {
      await pool.query('UPDATE requests SET reply_message = $1 WHERE id = $2', [JSON.stringify(conversation), request_id]);
    }
    res.json({ msg: 'Messages marked as read' });
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteRequest = async (req, res) => {
  const user_id = req.user.id;
  const { request_id } = req.params;

  try {
    const isOwner = await pool.query('SELECT * FROM requests WHERE id = $1 AND requester_id = $2', [request_id, user_id]);
    if (isOwner.rows.length === 0) return res.status(403).json({ msg: 'Not authorized to delete this request' });

    await pool.query('DELETE FROM requests WHERE id = $1', [request_id]);
    res.json({ msg: 'Request deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
