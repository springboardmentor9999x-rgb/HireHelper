const pool = require("../config/db");
const { mapStatusValueForColumnType, normalizeStatus } = require("../utils/taskStatus");

let cachedRequestStatusType = null;
let cachedTaskStatusType = null;
let requestSchemaReady = false;

async function ensureRequestSchema() {
  if (requestSchemaReady) {
    return;
  }

  await pool.query(`
    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
  `);

  // Ensure request status column supports text in case old schema used numeric values
  await pool.query(`
    ALTER TABLE requests
      ALTER COLUMN status TYPE VARCHAR(20)
      USING status::VARCHAR;
  `);

  await pool.query(`
    UPDATE requests r
    SET owner_id = t.user_id
    FROM tasks t
    WHERE r.task_id = t.id
      AND r.owner_id IS NULL;
  `);

  requestSchemaReady = true;
}

async function getRequestStatusColumnType() {
  if (cachedRequestStatusType) {
    return cachedRequestStatusType;
  }

  const result = await pool.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'requests' AND column_name = 'status'
     LIMIT 1`
  );

  cachedRequestStatusType = result.rows[0]?.data_type || "character varying";
  return cachedRequestStatusType;
}

function mapRequestStatusValueForColumnType(statusType, status) {
  const normalizedStatus = String(status).trim().toUpperCase();
  const mapping = {
    PENDING: 0,
    ACCEPTED: 1,
    REJECTED: 2,
  };

  if (["integer", "smallint", "bigint"].includes(statusType)) {
    return mapping[normalizedStatus] ?? 0;
  }

  return normalizedStatus;
}

async function getTaskStatusColumnType() {
  if (cachedTaskStatusType) {
    return cachedTaskStatusType;
  }

  const result = await pool.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'tasks' AND column_name = 'status'
     LIMIT 1`
  );

  cachedTaskStatusType = result.rows[0]?.data_type || "character varying";
  return cachedTaskStatusType;
}

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

const REQUEST_STATUS_LABELS = {
  0: "PENDING",
  1: "ACCEPTED",
  2: "REJECTED",
};

function normalizeRequestStatus(status) {
  if (status === null || status === undefined || status === "") {
    return "PENDING";
  }

  if (typeof status === "number") {
    return REQUEST_STATUS_LABELS[status] || `STATUS_${status}`;
  }

  const numericStatus = Number(status);
  if (!Number.isNaN(numericStatus) && String(status).trim() !== "") {
    return REQUEST_STATUS_LABELS[numericStatus] || `STATUS_${numericStatus}`;
  }

  return String(status).trim().toUpperCase();
}

function normalizeRequestRow(row) {
  return {
    ...row,
    status: normalizeRequestStatus(row.status),
  };
}

exports.createRequest = async (req, res) => {
  try {
    await ensureRequestSchema();

    const requester_id = req.user.id;
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ message: "task_id is required" });
    }

    const taskResult = await pool.query(
      `SELECT id, user_id, status, title
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [task_id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    const requesterResult = await pool.query(
      `SELECT first_name, last_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [requester_id]
    );

    const requester = requesterResult.rows[0] || {};
    const requesterName = `${requester.first_name || ""} ${requester.last_name || ""}`.trim() || "Someone";

    if (task.user_id === requester_id) {
      return res.status(400).json({ message: "You cannot request your own task" });
    }

    if (normalizeStatus(task.status) !== "OPEN") {
      return res.status(400).json({ message: "Task is not open for requests" });
    }

    const duplicateRequest = await pool.query(
      `SELECT id
       FROM requests
       WHERE task_id = $1 AND requester_id = $2
       LIMIT 1`,
      [task_id, requester_id]
    );

    if (duplicateRequest.rows.length > 0) {
      return res.status(409).json({ message: "You already requested this task" });
    }

    const requestStatusType = await getRequestStatusColumnType();
    const pendingStatusValue = mapRequestStatusValueForColumnType(requestStatusType, "PENDING");

    const requestResult = await pool.query(
      `INSERT INTO requests(task_id, requester_id, owner_id, status)
       VALUES($1, $2, $3, $4)
       RETURNING id, task_id, requester_id, owner_id, status, created_at`,
      [task_id, requester_id, task.user_id, pendingStatusValue]
    );

    await createNotification(
      task.user_id,
      `${requesterName} requested to help with your task${task.title ? `: "${task.title}"` : ""}.`,
      task_id
    );

    await createNotification(
      requester_id,
      `You requested to help with "${task.title || "a task"}".`,
      task_id
    );

    return res.status(201).json({
      message: "Request sent successfully",
      request: normalizeRequestRow(requestResult.rows[0]),
    });
  } catch (err) {
    console.error("[createRequest] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    await ensureRequestSchema();

    const ownerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ACCEPTED", "REJECTED"].includes(String(status).toUpperCase())) {
      return res.status(400).json({ message: "Status must be ACCEPTED or REJECTED" });
    }

    const requestResult = await pool.query(
      `SELECT r.id, r.task_id, r.requester_id, t.user_id AS owner_id, t.title,
              owner.first_name AS owner_first_name, owner.last_name AS owner_last_name
       FROM requests r
       JOIN tasks t ON t.id = r.task_id
       JOIN users owner ON owner.id = t.user_id
       WHERE r.id = $1
       LIMIT 1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestResult.rows[0];
    const ownerName = `${request.owner_first_name || ""} ${request.owner_last_name || ""}`.trim() || "The task owner";

    if (request.owner_id !== ownerId) {
      return res.status(403).json({ message: "You are not allowed to update this request" });
    }

    const requestStatusType = await getRequestStatusColumnType();
    const nextStatusValue = mapRequestStatusValueForColumnType(requestStatusType, status);

    const updatedRequest = await pool.query(
      `UPDATE requests
       SET status = $1
       WHERE id = $2
       RETURNING id, task_id, requester_id, owner_id, status, created_at`,
      [nextStatusValue, id]
    );

    if (String(status).toUpperCase() === "ACCEPTED") {
      const taskStatusType = await getTaskStatusColumnType();
      const assignedStatusValue = mapStatusValueForColumnType(taskStatusType, "ASSIGNED");
      await pool.query(
        `UPDATE tasks
         SET status = $1
         WHERE id = $2`,
        [assignedStatusValue, request.task_id]
      );
    }

    await createNotification(
      request.requester_id,
      `${ownerName} ${String(status).toUpperCase().toLowerCase()} your request for "${request.title || "a task"}".`,
      request.task_id
    );

    return res.json({
      message: "Request status updated",
      request: normalizeRequestRow(updatedRequest.rows[0]),
    });
  } catch (err) {
    console.error("[updateRequestStatus] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    await ensureRequestSchema();

    const requesterId = req.user.id;
    const requests = await pool.query(
      `SELECT r.*, t.title, t.location, t.category, t.urgency, t.tools_required, t.vehicle_required, t.contact_method,
              t.budget, t.helpers_needed, t.duration_hours, t.special_instructions
       FROM requests r
       JOIN tasks t ON r.task_id = t.id
       WHERE r.requester_id = $1
       ORDER BY r.created_at DESC`,
      [requesterId]
    );

    return res.json(requests.rows.map(normalizeRequestRow));
  } catch (err) {
    console.error("[getMyRequests] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getReceivedRequests = async (req, res) => {
  try {
    await ensureRequestSchema();

    const ownerId = req.user.id;
    const requests = await pool.query(
      `SELECT r.*, t.title, t.category, t.urgency, t.tools_required, t.vehicle_required, t.contact_method,
              t.budget, t.helpers_needed, t.duration_hours, t.special_instructions, u.first_name
       FROM requests r
       JOIN tasks t ON r.task_id = t.id
       JOIN users u ON r.requester_id = u.id
       WHERE t.user_id = $1
       ORDER BY r.created_at DESC`,
      [ownerId]
    );

    return res.json(requests.rows.map(normalizeRequestRow));
  } catch (err) {
    console.error("[getReceivedRequests] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    await ensureRequestSchema();

    const userId = req.user.id;
    const notifications = await pool.query(
      `SELECT
         r.id,
         r.task_id,
         r.status,
         r.created_at,
         t.title AS task_title,
         requester.first_name AS requester_first_name,
         requester.last_name AS requester_last_name,
         CASE
           WHEN r.owner_id = $1 THEN 'owner'
           ELSE 'requester'
         END AS audience
       FROM requests r
       JOIN tasks t ON t.id = r.task_id
       JOIN users requester ON requester.id = r.requester_id
       WHERE r.owner_id = $1 OR r.requester_id = $1
       ORDER BY r.created_at DESC
       LIMIT 25`,
      [userId]
    );

    const results = notifications.rows.map((notification) => {
      const requesterName = `${notification.requester_first_name || ""} ${notification.requester_last_name || ""}`.trim() || "A user";
      const taskTitle = notification.task_title || "your task";

      return {
        id: notification.id,
        task_id: notification.task_id,
        status: notification.status,
        created_at: notification.created_at,
        audience: notification.audience,
        message:
          notification.audience === "owner"
            ? `${requesterName} requested "${taskTitle}".`
            : `You requested "${taskTitle}".`
      };
    });

    return res.json(results);
  } catch (err) {
    console.error("[getNotifications] error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
