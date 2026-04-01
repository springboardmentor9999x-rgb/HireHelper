const db = require('../config/db');

exports.addTask = async (req, res) => {
  const { title, description, location, start_time, end_time, salary } = req.body;

  if (!title || !description || !location || !start_time) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO tasks 
      (user_id, title, description, location, start_time, end_time, picture, salary, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req.user.id,
        title,
        description,
        location,
        start_time,
        end_time || null,
        imagePath,
        salary || 0, 
        'OPEN'
      ]
    );

    res.status(201).json({ message: "Task created successfully" });

  } catch (err) {
    console.error("Add Task Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
  const now = new Date();
  const start = new Date(start_time);

  if (start < now) {
    return res.status(400).json({
      message: "Start time cannot be in the past ❌"
    });
}
};


exports.getMyTasks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id,title,description,location,start_time,status,picture,salary
       FROM tasks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error("Get Tasks Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getFeedTasks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id,title,description,location,start_time,status,picture,salary
       FROM tasks
       WHERE user_id != $1
       AND status = 'OPEN'
       AND start_time > NOW()
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json(result.rows || []);

  } catch (err) {
    console.error('Get Feed Tasks Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE tasks 
       SET status = 'CLOSED' 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json({
      message: "Task marked as CLOSED",
      task: result.rows[0]
    });

  } catch (err) {
    console.error("Update Status Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendOtp = async (req, res) => {
  const { task_id } = req.body;

  try {

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const task = await db.query(
      `SELECT t.*, u.email, u.first_name 
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.id=$1`,
      [task_id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    await db.query(
      `UPDATE tasks SET otp=$1, otp_expiry=$2 WHERE id=$3`,
      [otp, expiry, task_id]
    );

   
    const { sendEmail } = require('./auth.controller');

    sendEmail(
      task.rows[0].email,
      "Task Completion OTP 🔐",
      `Hello ${task.rows[0].first_name}, your OTP is: ${otp}`
    );

    res.json({ message: "OTP sent successfully 📩" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.verifyOtp = async (req, res) => {
  const { task_id, otp } = req.body;

  try {
    const task = await db.query(
      `SELECT * FROM tasks WHERE id=$1`,
      [task_id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const data = task.rows[0];

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

   
    if (new Date() > data.otp_expiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

   
    await db.query(
      `UPDATE tasks 
       SET status='COMPLETED', otp=NULL, otp_expiry=NULL 
       WHERE id=$1`,
      [task_id]
    );

   
    await db.query(
      `UPDATE requests 
       SET status='COMPLETED' 
       WHERE task_id=$1 AND status='ACCEPTED'`,
      [task_id]
    );

    await db.query(
      `INSERT INTO notifications (user_id, message, type, task_id)
       VALUES ($1,$2,'task',$3)`,
      [
        data.user_id,
        `Your task has been completed successfully ✅`,
        task_id
      ]
    );

    res.json({ message: "Task completed successfully ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};