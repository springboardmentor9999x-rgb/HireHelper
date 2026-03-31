const pool = require("../config/db");
const { mapStatusValueForColumnType, normalizeTask } = require("../utils/taskStatus");

let cachedStatusType = null;

async function createNotification(userId, message, taskId = null) {
  if (!userId || !message) {
    return;
  }

  await pool.query(
    `INSERT INTO notifications (user_id, task_id, message, body)
     VALUES ($1, $2, $3, $3)`,
    [userId, taskId, message]
  );
}

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
    const {
      title,
      description,
      location,
      category,
      urgency,
      tools_required,
      vehicle_required,
      contact_method,
      budget,
      helpers_needed,
      duration_hours,
      special_instructions,
      start_time,
      end_time,
      picture
    } = req.body;

    if (!title || !description || !location || !category || !urgency || !contact_method || !start_time || !picture) {
      return res.status(400).json({
        message: "Title, description, location, category, urgency, contact_method, start_time and picture are required"
      });
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedLocation = location.trim();
    const normalizedCategory = category.trim();
    const normalizedUrgency = urgency.trim().toUpperCase();
    const normalizedContactMethod = contact_method.trim();
    const normalizedPicture = picture.trim();
    const normalizedSpecialInstructions = (special_instructions || "").trim();
    const toolsRequiredBool = tools_required === true || tools_required === "true" || tools_required === 1 || tools_required === "1";
    const vehicleRequiredBool = vehicle_required === true || vehicle_required === "true" || vehicle_required === 1 || vehicle_required === "1";
    const budgetNumber = Number(budget);
    const helpersNeededNumber = Number(helpers_needed);
    const durationHoursNumber = Number(duration_hours);

    if (
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedLocation ||
      !normalizedCategory ||
      !normalizedUrgency ||
      !normalizedContactMethod ||
      !normalizedPicture
    ) {
      return res.status(400).json({ message: "Required fields cannot be empty" });
    }

    if (!["LOW", "MEDIUM", "HIGH"].includes(normalizedUrgency)) {
      return res.status(400).json({ message: "Urgency must be LOW, MEDIUM, or HIGH" });
    }

    if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
      return res.status(400).json({ message: "Budget must be a positive number" });
    }

    if (!Number.isInteger(helpersNeededNumber) || helpersNeededNumber <= 0) {
      return res.status(400).json({ message: "Helpers needed must be a positive whole number" });
    }

    if (!Number.isFinite(durationHoursNumber) || durationHoursNumber <= 0) {
      return res.status(400).json({ message: "Duration must be a positive number of hours" });
    }

    const statusType = await getStatusColumnType();
    const defaultStatusValue = mapStatusValueForColumnType(statusType, "OPEN");
    const newTask = await pool.query(
      `INSERT INTO tasks(
         user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
         budget, helpers_needed, duration_hours, special_instructions,
         start_time, end_time, picture, status
       )
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
                 budget, helpers_needed, duration_hours, special_instructions,
                 start_time, end_time, picture, status, created_at`,
      [
        user_id,
        normalizedTitle,
        normalizedDescription,
        normalizedLocation,
        normalizedCategory,
        normalizedUrgency,
        toolsRequiredBool,
        vehicleRequiredBool,
        normalizedContactMethod,
        budgetNumber,
        helpersNeededNumber,
        durationHoursNumber,
        normalizedSpecialInstructions || null,
        start_time,
        end_time || null,
        normalizedPicture,
        defaultStatusValue
      ]
    );

    await createNotification(
      user_id,
      `Task created successfully${normalizedTitle ? `: "${normalizedTitle}"` : ""}.`,
      newTask.rows[0].id
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
    const {
      title,
      description,
      location,
      category,
      urgency,
      tools_required,
      vehicle_required,
      contact_method,
      budget,
      helpers_needed,
      duration_hours,
      special_instructions,
      start_time,
      end_time,
      picture
    } = req.body;

    if (!title || !description || !location || !category || !urgency || !contact_method || !start_time || !picture) {
      return res.status(400).json({
        message: "Title, description, location, category, urgency, contact_method, start_time and picture are required"
      });
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedLocation = location.trim();
    const normalizedCategory = category.trim();
    const normalizedUrgency = urgency.trim().toUpperCase();
    const normalizedContactMethod = contact_method.trim();
    const normalizedPicture = picture.trim();
    const normalizedSpecialInstructions = (special_instructions || "").trim();
    const toolsRequiredBool = tools_required === true || tools_required === "true" || tools_required === 1 || tools_required === "1";
    const vehicleRequiredBool = vehicle_required === true || vehicle_required === "true" || vehicle_required === 1 || vehicle_required === "1";
    const budgetNumber = Number(budget);
    const helpersNeededNumber = Number(helpers_needed);
    const durationHoursNumber = Number(duration_hours);

    if (
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedLocation ||
      !normalizedCategory ||
      !normalizedUrgency ||
      !normalizedContactMethod ||
      !normalizedPicture
    ) {
      return res.status(400).json({ message: "Required fields cannot be empty" });
    }

    if (!["LOW", "MEDIUM", "HIGH"].includes(normalizedUrgency)) {
      return res.status(400).json({ message: "Urgency must be LOW, MEDIUM, or HIGH" });
    }

    if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
      return res.status(400).json({ message: "Budget must be a positive number" });
    }

    if (!Number.isInteger(helpersNeededNumber) || helpersNeededNumber <= 0) {
      return res.status(400).json({ message: "Helpers needed must be a positive whole number" });
    }

    if (!Number.isFinite(durationHoursNumber) || durationHoursNumber <= 0) {
      return res.status(400).json({ message: "Duration must be a positive number of hours" });
    }

    const taskCheck = await pool.query(
      `SELECT id, user_id, title
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
           category = $4,
           urgency = $5,
           tools_required = $6,
           vehicle_required = $7,
           contact_method = $8,
           budget = $9,
           helpers_needed = $10,
           duration_hours = $11,
           special_instructions = $12,
           start_time = $13,
           end_time = $14,
           picture = $15
       WHERE id = $16
       RETURNING id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
                 budget, helpers_needed, duration_hours, special_instructions,
                 start_time, end_time, picture, status, created_at`,
      [
        normalizedTitle,
        normalizedDescription,
        normalizedLocation,
        normalizedCategory,
        normalizedUrgency,
        toolsRequiredBool,
        vehicleRequiredBool,
        normalizedContactMethod,
        budgetNumber,
        helpersNeededNumber,
        durationHoursNumber,
        normalizedSpecialInstructions || null,
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

    await createNotification(
      user_id,
      `Task deleted successfully${taskCheck.rows[0].title ? `: "${taskCheck.rows[0].title}"` : ""}.`
    );

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
       RETURNING id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
                 budget, helpers_needed, duration_hours, special_instructions,
                 start_time, end_time, picture, status, created_at`,
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
       RETURNING id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
                 budget, helpers_needed, duration_hours, special_instructions,
                 start_time, end_time, picture, status, created_at`,
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
      `SELECT id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
              budget, helpers_needed, duration_hours, special_instructions,
              start_time, end_time, picture, status, created_at
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
      `SELECT id, user_id, title, description, location, category, urgency, tools_required, vehicle_required, contact_method,
              budget, helpers_needed, duration_hours, special_instructions,
              start_time, end_time, picture, status, created_at
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
