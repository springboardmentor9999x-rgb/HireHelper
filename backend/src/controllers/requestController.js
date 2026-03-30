/**
 * Request Controller
 * Handles request operations (sending, managing, accepting, rejecting)
 */

const pool = require('../config/db');

const requestController = {
  /**
   * SEND REQUEST - POST /api/requests
   * User sends a request to a task
   */
  sendRequest: async (req, res) => {
    try {
      const requesterId = req.user.id;
      const { task_id } = req.body;

      // Validate input
      if (!task_id) {
        return res.status(400).json({
          success: false,
          message: 'task_id is required'
        });
      }

      // 1. Check if task exists
      const taskCheck = await pool.query(
        'SELECT id, user_id, status, title FROM tasks WHERE id = $1',
        [task_id]
      );

      if (taskCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const task = taskCheck.rows[0];

      // 2. Check if task status is OPEN
      if (task.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Task is not available for requests'
        });
      }

      // 3. Check if user is not task owner
      if (task.user_id === requesterId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot request your own task'
        });
      }

      // 4. Check for duplicate request
      const duplicateCheck = await pool.query(
        'SELECT id FROM requests WHERE task_id = $1 AND requester_id = $2',
        [task_id, requesterId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already requested this task'
        });
      }

      // 5. Insert request
      const result = await pool.query(
        'INSERT INTO requests (task_id, requester_id, status) VALUES ($1, $2, $3) RETURNING *',
        [task_id, requesterId, 'PENDING']
      );

      // 6. Create notification for task owner
      const notificationMessage = `Someone requested to help with your task "${task.title}".`;
      await pool.query(
        'INSERT INTO notifications (user_id, body) VALUES ($1, $2)',
        [task.user_id, notificationMessage]
      );

      console.log(`✅ Request sent: User ${requesterId} requested task ${task_id}`);
      console.log(`📬 Notification sent to task owner ${task.user_id}`);

      res.status(201).json({
        success: true,
        message: 'Request sent successfully',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error sending request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send request',
        error: error.message
      });
    }
  },

  /**
   * GET MY REQUESTS - GET /api/requests/my
   * Get requests sent by logged user
   */
  getMyRequests: async (req, res) => {
    try {
      const requesterId = req.user.id;

      const result = await pool.query(
        `SELECT 
          r.id,
          r.task_id,
          r.status,
          r.created_at,
          t.title,
          t.location,
          t.user_id as task_owner_id,
          u.first_name as task_owner_name
        FROM requests r
        JOIN tasks t ON r.task_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE r.requester_id = $1
        ORDER BY r.created_at DESC`,
        [requesterId]
      );

      console.log(`✅ Fetched ${result.rows.length} requests for user ${requesterId}`);

      res.status(200).json({
        success: true,
        message: `Loaded ${result.rows.length} request(s)`,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error fetching my requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch requests',
        error: error.message
      });
    }
  },

  /**
   * GET RECEIVED REQUESTS - GET /api/requests/received
   * Get requests received for user's tasks
   */
  getReceivedRequests: async (req, res) => {
    try {
      const taskOwnerId = req.user.id;

      const result = await pool.query(
        `SELECT 
          r.id,
          r.task_id,
          r.requester_id,
          r.status,
          r.created_at,
          t.title,
          t.location,
          t.status as task_status,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name,
          u.email as requester_email
        FROM requests r
        JOIN tasks t ON r.task_id = t.id
        JOIN users u ON r.requester_id = u.id
        WHERE t.user_id = $1
        ORDER BY r.created_at DESC`,
        [taskOwnerId]
      );

      console.log(`✅ Fetched ${result.rows.length} received requests for user ${taskOwnerId}`);

      res.status(200).json({
        success: true,
        message: `Loaded ${result.rows.length} request(s)`,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error fetching received requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch requests',
        error: error.message
      });
    }
  },

  /**
   * GET REQUEST DETAILS - GET /api/requests/:id
   */
  getRequestById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT r.*, t.title, t.location, u.first_name, u.last_name
         FROM requests r
         JOIN tasks t ON r.task_id = t.id
         JOIN users u ON r.requester_id = u.id
         WHERE r.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch request',
        error: error.message
      });
    }
  },

  /**
   * ACCEPT REQUEST - PUT /api/requests/:id/accept
   * Task owner accepts a request
   */
  acceptRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const taskOwnerId = req.user.id;

      // Get request details
      const request = await pool.query(
        'SELECT * FROM requests WHERE id = $1',
        [id]
      );

      if (request.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // Verify task owner
      const task = await pool.query(
        'SELECT user_id FROM tasks WHERE id = $1',
        [request.rows[0].task_id]
      );

      if (task.rows[0].user_id !== taskOwnerId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to accept this request'
        });
      }

      // Update request status
      const result = await pool.query(
        'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['ACCEPTED', id]
      );

      const taskId = request.rows[0].task_id;
      const requesterId = request.rows[0].requester_id;

      // Update task status to ASSIGNED
      await pool.query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        ['ASSIGNED', taskId]
      );

      // Create notification for requester (person who sent the request)
      const notificationMessage = `Your request has been accepted! The task owner will contact you soon.`;
      await pool.query(
        'INSERT INTO notifications (user_id, body) VALUES ($1, $2)',
        [requesterId, notificationMessage]
      );

      console.log(`✅ Request ${id} accepted`);
      console.log(`📍 Task ${taskId} status updated to ASSIGNED`);
      console.log(`📬 Notification sent to requester ${requesterId}`);

      res.status(200).json({
        success: true,
        message: 'Request accepted successfully',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error accepting request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept request',
        error: error.message
      });
    }
  },

  /**
   * REJECT REQUEST - PUT /api/requests/:id/reject
   */
  rejectRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const taskOwnerId = req.user.id;

      // Get request details
      const request = await pool.query(
        'SELECT * FROM requests WHERE id = $1',
        [id]
      );

      if (request.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // Verify task owner
      const task = await pool.query(
        'SELECT user_id FROM tasks WHERE id = $1',
        [request.rows[0].task_id]
      );

      if (task.rows[0].user_id !== taskOwnerId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to reject this request'
        });
      }

      // Update request status
      const result = await pool.query(
        'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['REJECTED', id]
      );

      const requesterId = request.rows[0].requester_id;

      // Create notification for requester (person who sent the request)
      const notificationMessage = `Your request was not accepted at this time. You can try other tasks.`;
      await pool.query(
        'INSERT INTO notifications (user_id, body) VALUES ($1, $2)',
        [requesterId, notificationMessage]
      );

      console.log(`❌ Request ${id} rejected`);
      console.log(`📬 Notification sent to requester ${requesterId}`);

      res.status(200).json({
        success: true,
        message: 'Request rejected successfully',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject request',
        error: error.message
      });
    }
  },

  /**
   * CANCEL REQUEST - DELETE /api/requests/:id
   * User who sent request can cancel it
   */
  cancelRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;

      // Get request details
      const request = await pool.query(
        'SELECT * FROM requests WHERE id = $1',
        [id]
      );

      if (request.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // Verify requester
      if (request.rows[0].requester_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this request'
        });
      }

      // Delete request
      await pool.query('DELETE FROM requests WHERE id = $1', [id]);

      console.log(`🗑️ Request ${id} cancelled`);

      res.status(200).json({
        success: true,
        message: 'Request cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel request',
        error: error.message
      });
    }
  }
};

module.exports = requestController;
