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
    console.log("🔍 [Task] Create task request - USER:", req.user.id);
    console.log("📝 [Task] Body:", req.body);
    console.log("🖼️ [Task] File info:", req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    } : 'No file');

    const userId = req.user.id;

    const {
      title,
      description,
      category,
      location,
      start_time,
      end_time,
      budget,
      status,
      priority
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, location, and start time are required'
      });
    }

    // Get image path if file was uploaded
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    console.log("📸 [Task] Image path:", imagePath);

    const result = await pool.query(
      `INSERT INTO tasks 
      (title, description, category, location, start_time, end_time, budget, user_id, picture, status, priority)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [title, description, category, location, start_time, end_time, budget, userId, imagePath, status || 'OPEN', priority || 'medium']
    );

    console.log("✅ [Task] Task created successfully:", result.rows[0].id);
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [Task] Error creating task:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message,
      code: error.code
    });
  }
};

// UPDATE task
exports.updateTask = async (req, res) => {
  try {
    console.log("🔍 [Task] Update task request - USER:", req.user.id, "TASK:", req.params.id);
    console.log("📝 [Task] Body:", req.body);
    console.log("🖼️ [Task] File:", req.file ? req.file.filename : 'None');

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
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    const existingTask = checkResult.rows[0];

    // Get image path if new file was uploaded, otherwise keep existing
    let imagePath = existingTask.picture;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      console.log("📸 [Task] New image uploaded:", {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: imagePath
      });
    } else {
      console.log("📸 [Task] Keeping existing image:", imagePath);
    }

    // Build update query with only provided fields
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined && title !== '') {
      updateFields.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }

    if (description !== undefined && description !== '') {
      updateFields.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (category !== undefined && category !== '') {
      updateFields.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (location !== undefined && location !== '') {
      updateFields.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }

    if (start_time !== undefined && start_time !== '') {
      updateFields.push(`start_time = $${paramIndex}`);
      params.push(start_time);
      paramIndex++;
    }

    if (end_time !== undefined && end_time !== '') {
      updateFields.push(`end_time = $${paramIndex}`);
      params.push(end_time);
      paramIndex++;
    }

    if (budget !== undefined && budget !== '') {
      updateFields.push(`budget = $${paramIndex}`);
      params.push(parseFloat(budget));
      paramIndex++;
    }

    // Always update image if provided (even if null)
    updateFields.push(`picture = $${paramIndex}`);
    params.push(imagePath);
    paramIndex++;

    // Always update timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add taskId and userId to params for WHERE clause
    params.push(taskId);
    params.push(userId);

    if (updateFields.length === 2) {
      // Only timestamp was added, nothing to update
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const query = `UPDATE tasks 
                   SET ${updateFields.join(', ')}
                   WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
                   RETURNING *`;

    console.log("🔧 Query:", query);
    console.log("📌 Params:", params);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    console.log("✅ [Task] Task updated successfully:", taskId);
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [Task] Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
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
       AND LOWER(t.status) != 'closed'
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