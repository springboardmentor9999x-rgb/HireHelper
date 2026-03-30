const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const pool = require('../config/db');

/**
 * POST Create a new task
 * POST /api/tasks
 * 
 * Request body (FormData):
 * {
 *   "title": "string (required)",
 *   "description": "string (required)",
 *   "location": "string (optional)",
 *   "start_time": "timestamp (optional)",
 *   "end_time": "timestamp (optional)",
 *   "image": "file (optional)"
 * }
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, location, start_time, end_time } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Insert task into database
    const query = `
      INSERT INTO tasks (user_id, title, description, location, start_time, end_time, picture, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, user_id, title, description, location, start_time, end_time, picture, created_at
    `;

    const values = [
      userId,
      title.trim(),
      description.trim(),
      location ? location.trim() : null,
      start_time || null,
      end_time || null,
      imageFilename,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
});

/**
 * GET all tasks for current user (My tasks)
 * GET /api/tasks/my
 */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 Fetching tasks for user: ${userId}`);

    const query = `
      SELECT id, user_id, title, description, location, start_time, end_time, created_at
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    console.log(`✅ Found ${result.rows.length} tasks for user ${userId}`);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error('❌ Error fetching my tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
});

/**
 * GET all tasks for current user (My tasks - new endpoint)
 * GET /api/tasks/my-tasks
 */
router.get('/my-tasks', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📥 Fetching tasks for user: ${userId}`);

    const query = `
      SELECT 
        id, 
        user_id, 
        title, 
        description, 
        location, 
        start_time, 
        end_time, 
        status,
        picture,
        created_at
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    console.log(`✅ Found ${result.rows.length} tasks for user ${userId}`);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error('❌ Error fetching my tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
});

/**
 * GET all tasks from all users (Feed)
 * GET /api/tasks
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, user_id, title, description, location, start_time, end_time, status, picture, created_at
      FROM tasks
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
});

/**
 * GET single task by ID
 * GET /api/tasks/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const query = `
      SELECT id, user_id, title, description, location, start_time, end_time, created_at
      FROM tasks
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
});

/**
 * UPDATE task
 * PUT /api/tasks/:id
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, location, start_time, end_time } = req.body;

    // Build dynamic query only for provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description.trim());
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location ? location.trim() : null);
    }
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(end_time);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    values.push(id, userId);
    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount}
      RETURNING id, user_id, title, description, location, start_time, end_time, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0],
    });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
});

/**
 * DELETE task
 * DELETE /api/tasks/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
});

module.exports = router;
