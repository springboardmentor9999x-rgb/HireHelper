const db = require('../config/db');
const { sendEmail } = require('./auth.controller');

exports.sendRequest = async (req, res) => {
  const { task_id } = req.body;
  const requester_id = req.user.id;

  try {
    const task = await db.query(
      `SELECT id, user_id, title FROM tasks WHERE id=$1`,
      [task_id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const owner_id = task.rows[0].user_id;
    const title = task.rows[0].title;

    const user = await db.query(
      `SELECT first_name, email FROM users WHERE id=$1`,
      [requester_id]
    );

    const sender_name = user.rows[0].first_name;
    const sender_email = user.rows[0].email;

    await db.query(
      `INSERT INTO requests (task_id, requester_id, status)
       VALUES ($1,$2,'OPEN')`,
      [task_id, requester_id]
    );

    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message, task_id, type)
       VALUES ($1,$2,$3,$4,'request')`,
      [
        owner_id,
        requester_id,
        `${sender_name} (${sender_email}) sent a request for "${title}"`,
        task_id
      ]
    );

    const owner = await db.query(`SELECT email FROM users WHERE id=$1`, [owner_id]);

    sendEmail(
      owner.rows[0].email,
      "New Request 📩",
      `${sender_name} sent a request for "${title}".`
    );

    res.json({ message: 'Request sent successfully ✅' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getMyRequests = async (req, res) => {
  const result = await db.query(
    `SELECT r.*, t.title, t.location
     FROM requests r
     JOIN tasks t ON r.task_id=t.id
     WHERE r.requester_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
};

exports.getReceivedRequests = async (req, res) => {
  const result = await db.query(
    `SELECT 
        r.id,
        r.task_id,
        r.requester_id,
        r.status AS request_status,   -- 🔥 IMPORTANT FIX
        t.title,
        u.first_name
     FROM requests r
     JOIN tasks t ON r.task_id = t.id
     JOIN users u ON r.requester_id = u.id
     WHERE t.user_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
};

exports.acceptRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const r = await db.query(
      `SELECT r.*, t.title 
       FROM requests r
       JOIN tasks t ON r.task_id = t.id
       WHERE r.id=$1`,
      [requestId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const data = r.rows[0];
    await db.query(
      `UPDATE requests SET status='ACCEPTED' WHERE id=$1`,
      [requestId]
    );

    await db.query(
      `UPDATE requests 
       SET status='REJECTED' 
       WHERE task_id=$1 AND id != $2`,
      [data.task_id, requestId]
    );

    const owner = await db.query(
      `SELECT first_name FROM users WHERE id=$1`,
      [req.user.id]
    );

    const owner_name = owner.rows[0].first_name;

    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message, task_id, type)
       VALUES ($1,$2,$3,$4,'request')`,
      [
        data.requester_id,
        req.user.id,
        `Your request for "${data.title}" has been ACCEPTED by ${owner_name}`,
        data.task_id
      ]
    );

    res.json({ message: "Accepted ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.rejectRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const r = await db.query(
      `SELECT r.*, t.title 
       FROM requests r
       JOIN tasks t ON r.task_id = t.id
       WHERE r.id=$1`,
      [requestId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const data = r.rows[0];

    await db.query(
      `UPDATE requests SET status='REJECTED' WHERE id=$1`,
      [requestId]
    );

    const owner = await db.query(
      `SELECT first_name FROM users WHERE id=$1`,
      [req.user.id]
    );

    const owner_name = owner.rows[0].first_name;

    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message, task_id, type)
       VALUES ($1,$2,$3,$4,'request')`,
      [
        data.requester_id,
        req.user.id,
        `Your request for "${data.title}" has been REJECTED by ${owner_name}`,
        data.task_id
      ]
    );

    res.json({ message: "Rejected ❌" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};