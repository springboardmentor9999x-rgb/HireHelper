const express = require('express');
const router = express.Router();
const pool = require('../db');
const upload = require('../src/middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/auth');

// apply auth to all task routes
router.use(authenticateToken);

// create - with file upload
router.post('/', upload.single('image'), async (req, res) => {
  console.log('📝 Task creation request received');
  console.log('User ID:', req.user?.id);
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.filename : 'no file');

  const userId = req.user?.id;
  const { title, description, location, start_time, end_time } = req.body;

  if (!userId) {
    console.error('❌ No user ID - authentication failed');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!title || !description) {
    console.error('❌ Missing required fields');
    return res.status(400).json({ success: false, error: 'title and description are required' });
  }

  try {
    // Get the uploaded filename if file exists
    const imageFilename = req.file ? req.file.filename : null;
    console.log('Image filename:', imageFilename || 'none');

    // Try with image column first
    const query = `
      INSERT INTO tasks
        (user_id, title, description, location, start_time, end_time, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,'OPEN',CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      userId,
      title.trim(),
      description.trim(),
      location || null,
      start_time || null,
      end_time || null,
    ];

    console.log('Executing query with values:', values);
    const { rows } = await pool.query(query, values);
    console.log('✅ Task created:', rows[0]?.id);
    
    // If we have an image and the insert succeeded, we can update it in a separate query
    if (imageFilename && rows.length > 0) {
      try {
        await pool.query(
          'UPDATE tasks SET image = $1 WHERE id = $2',
          [imageFilename, rows[0].id]
        );
        console.log('✅ Image saved to database');
      } catch (imgErr) {
        console.log('⚠️ Image column might not exist, skipping image update:', imgErr.message);
      }
    }
    
    res.status(201).json({ success: true, message: 'Task created successfully', data: rows[0] });
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ success: false, error: 'Failed to create task: ' + err.message });
  }
});

// get my tasks - MUST be before /:id
router.get('/my-tasks', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/tasks/my-tasks', err);
    res.status(500).json({ success: false, error: 'failed to fetch tasks' });
  }
});

// get all for current user (legacy route)
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/tasks', err);
    res.status(500).json({ success: false, error: 'failed to fetch tasks' });
  }
});

// get one
router.get('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'task not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/tasks/:id', err);
    res.status(500).json({ error: 'failed to fetch task' });
  }
});

// update
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, location, start_time, end_time, status, picture } = req.body;

  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  if (description !== undefined && description.trim() === '') {
    return res.status(400).json({ error: 'description cannot be empty' });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) {
    updates.push(`title=$${idx++}`);
    values.push(title.trim());
  }
  if (description !== undefined) {
    updates.push(`description=$${idx++}`);
    values.push(description.trim());
  }
  if (location !== undefined) {
    updates.push(`location=$${idx++}`);
    values.push(location);
  }
  if (start_time !== undefined) {
    updates.push(`start_time=$${idx++}`);
    values.push(start_time);
  }
  if (end_time !== undefined) {
    updates.push(`end_time=$${idx++}`);
    values.push(end_time);
  }
  if (status !== undefined) {
    updates.push(`status=$${idx++}`);
    values.push(status);
  }
  if (picture !== undefined) {
    updates.push(`picture=$${idx++}`);
    values.push(picture);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'nothing to update' });
  }

  values.push(id, userId); // for WHERE clause

  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id=$${idx++} AND user_id=$${idx} RETURNING *`;

  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'task not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/tasks/:id', err);
    res.status(500).json({ error: 'failed to update task' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'task not found' });
    }
    res.json({ message: 'task deleted' });
  } catch (err) {
    console.error('DELETE /api/tasks/:id', err);
    res.status(500).json({ error: 'failed to delete task' });
  }
});

module.exports = router;
