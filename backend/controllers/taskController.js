const pool = require("../config/db");
const { mapStatusValueForColumnType, normalizeTask } = require("../utils/taskStatus");

let cachedStatusType = null;

async function getStatusColumnType() {
  if (cachedStatusType) {
    return cachedStatusType;
  }

  const result = await pool.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'tasks' AND column_name = 'status'
     LIMIT 1`
  );

  cachedStatusType = result.rows[0]?.data_type || "character varying";
  return cachedStatusType;
}

// ADD TASK
exports.addTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { title, description, location, start_time, end_time, picture } = req.body;

    if (!title || !description || !location || !start_time || !picture) {
      return res.status(400).json({ message: "Title, description, location, start_time and picture are required" });
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedLocation = location.trim();
    const normalizedPicture = picture.trim();

    if (!normalizedTitle || !normalizedDescription || !normalizedLocation || !normalizedPicture) {
      return res.status(400).json({ message: "Required fields cannot be empty" });
    }

    const statusType = await getStatusColumnType();
    const defaultStatusValue = mapStatusValueForColumnType(statusType, "OPEN");
    const newTask = await pool.query(
      `INSERT INTO tasks(user_id, title, description, location, start_time, end_time, picture, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, title, description, location, start_time, end_time, picture, status, created_at`,
      [
        user_id,
        normalizedTitle,
        normalizedDescription,
        normalizedLocation,
        start_time,
        end_time || null,
        normalizedPicture,
        defaultStatusValue
      ]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: normalizeTask(newTask.rows[0]),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { title, description, location, start_time, end_time, picture } = req.body;

    if (!title || !description || !location || !start_time || !picture) {
      return res.status(400).json({ message: "Title, description, location, start_time and picture are required" });
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedLocation = location.trim();
    const normalizedPicture = picture.trim();

    if (!normalizedTitle || !normalizedDescription || !normalizedLocation || !normalizedPicture) {
      return res.status(400).json({ message: "Required fields cannot be empty" });
    }

    const taskCheck = await pool.query(
      `SELECT id, user_id
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (taskCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "You are not allowed to edit this task" });
    }

    const updatedTask = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           location = $3,
           start_time = $4,
           end_time = $5,
           picture = $6
       WHERE id = $7
       RETURNING id, user_id, title, description, location, start_time, end_time, picture, status, created_at`,
      [
        normalizedTitle,
        normalizedDescription,
        normalizedLocation,
        start_time,
        end_time || null,
        normalizedPicture,
        id
      ]
    );

    return res.json({
      message: "Task updated successfully",
      task: normalizeTask(updatedTask.rows[0]),
    });
  } catch (err) {
    console.error("[updateTask] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const taskCheck = await pool.query(
      `SELECT id, user_id
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (taskCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "You are not allowed to delete this task" });
    }

    await pool.query(
      `DELETE FROM tasks
       WHERE id = $1`,
      [id]
    );

    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("[deleteTask] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// CLOSE TASK
exports.closeTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const taskCheck = await pool.query(
      `SELECT id, user_id
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (taskCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "You are not allowed to close this task" });
    }

    const statusType = await getStatusColumnType();
    const closedStatusValue = mapStatusValueForColumnType(statusType, "CANCELLED");

    const updatedTask = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING id, user_id, title, description, location, start_time, end_time, picture, status, created_at`,
      [closedStatusValue, id]
    );

    return res.json({
      message: "Task closed successfully",
      task: normalizeTask(updatedTask.rows[0]),
    });
  } catch (err) {
    console.error("[closeTask] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// REOPEN TASK
exports.reopenTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const taskCheck = await pool.query(
      `SELECT id, user_id
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (taskCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "You are not allowed to reopen this task" });
    }

    const statusType = await getStatusColumnType();
    const openStatusValue = mapStatusValueForColumnType(statusType, "OPEN");

    const updatedTask = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING id, user_id, title, description, location, start_time, end_time, picture, status, created_at`,
      [openStatusValue, id]
    );

    return res.json({
      message: "Task reopened successfully",
      task: normalizeTask(updatedTask.rows[0]),
    });
  } catch (err) {
    console.error("[reopenTask] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// MY TASKS
exports.getMyTasks = async (req, res) => {
  try {
    const user_id = req.user.id;

    const tasks = await pool.query(
      `SELECT id, user_id, title, description, location, start_time, end_time, picture, status, created_at
       FROM tasks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(tasks.rows.map(normalizeTask));
  } catch (err) {
    console.error("[getMyTasks] error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// FEED (others tasks)
exports.getFeedTasks = async (req, res) => {
  try {
    const user_id = req.user.id;

    const tasks = await pool.query(
      `SELECT id, user_id, title, description, location, start_time, end_time, picture, status, created_at
       FROM tasks
       WHERE user_id != $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(tasks.rows.map(normalizeTask));
  } catch (err) {
    console.error("[getFeedTasks] error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
