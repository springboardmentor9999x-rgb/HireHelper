const pool = require('../config/db');

// GET all tasks for the logged-in user
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Fetching tasks for user:', userId);

    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log('✅ Tasks fetched:', result.rows.length);
    res.status(200).json({
      success: true,
      message: `Loaded ${result.rows.length} task(s)`,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error fetching tasks:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message,
      code: error.code
    });
  }
};

// GET single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE id = $1 AND user_id = $2`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// CREATE new task
exports.createTask = async (req, res) => {
  try {
    console.log("USER:", req.user); // DEBUG

    const userId = req.user.id;

    const {
      title,
      description,
      category,
      location,
      start_time,
      end_time,
      budget
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, location, and start time are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks 
      (title, description, category, location, start_time, end_time, budget, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [title, description, category, location, start_time, end_time, budget, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

// UPDATE task
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const {
      title,
      description,
      category,
      location,
      start_time,
      end_time,
      budget
    } = req.body;

    // Check if task belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           location = COALESCE($4, location),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           budget = COALESCE($7, budget),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, description, category, location, start_time, end_time, budget, taskId, userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

// DELETE task
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // Check if task belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// GET feed - all tasks from all users
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 Fetching feed for user: ${userId}`);

    const result = await pool.query(
      `SELECT t.*,
       u.email as owner_email,
       CASE WHEN EXISTS(
         SELECT 1 FROM requests 
         WHERE requests.task_id = t.id 
         AND requests.requester_id = $1
       ) THEN true ELSE false END as is_requested
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id != $1 
       ORDER BY t.created_at DESC`,
      [userId]
    );

    console.log(`✅ Feed fetched: ${result.rows.length} tasks from other users`);
    res.status(200).json({
      success: true,
      message: `Loaded ${result.rows.length} task(s)`,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed',
      error: error.message
    });
  }
};

// CLOSE task - mark as complete
exports.closeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // Check if task belongs to user
    const checkResult = await pool.query(
      'SELECT id, user_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = checkResult.rows[0];

    // Only task owner can close the task
    if (task.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only task owner can close this task'
      });
    }

    // Update task status to CLOSED
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['closed', taskId]
    );

    console.log(`✅ Task ${taskId} closed by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task closed successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error closing task:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing task',
      error: error.message
    });
  }
};