import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const sendRequest = async (req: AuthRequest, res: Response) => {
    const { task_id, message } = req.body;
    const requesterId = req.user?.id;

    if (!task_id) {
        return res.status(400).json({ message: 'Task ID is required' });
    }

    if (!requesterId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Validate: Task exists, status = OPEN, user is not the task owner
        const taskQuery = 'SELECT * FROM tasks WHERE id = $1';
        const taskResult = await pool.query(taskQuery, [task_id]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = taskResult.rows[0];

        if (task.status !== 'OPEN') {
            return res.status(400).json({ message: 'Task is not open for requests' });
        }

        if (task.user_id === requesterId) {
            return res.status(400).json({ message: 'You cannot request your own task' });
        }

        // Prevent Duplicate Requests
        const duplicateQuery = 'SELECT * FROM requests WHERE task_id = $1 AND requester_id = $2';
        const duplicateResult = await pool.query(duplicateQuery, [task_id, requesterId]);

        if (duplicateResult.rows.length > 0) {
            return res.status(400).json({ message: 'You already requested this task' });
        }

        // Insert request
        const insertQuery = `
            INSERT INTO requests (task_id, requester_id, message)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const insertResult = await pool.query(insertQuery, [task_id, requesterId, message]);

        // Create notification for task owner
        const notificationQuery = `
            INSERT INTO notifications (user_id, body)
            VALUES ($1, $2);
        `;
        await pool.query(notificationQuery, [task.user_id, 'Someone requested to help with your task.']);

        res.status(201).json({
            message: 'Request sent successfully',
            request: insertResult.rows[0]
        });

    } catch (error) {
        console.error('Error sending request:', error);
        res.status(500).json({ message: 'Server error while sending request' });
    }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be ACCEPTED or REJECTED.' });
    }

    try {
        // Verify task owner
        const checkQuery = `
            SELECT r.*, t.user_id as owner_id 
            FROM requests r
            JOIN tasks t ON r.task_id = t.id
            WHERE r.id = $1;
        `;
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = checkResult.rows[0];

        if (request.owner_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized: You do not own this task' });
        }

        // Update request status
        const updateRequestQuery = `
            UPDATE requests
            SET status = $1
            WHERE id = $2
            RETURNING *;
        `;
        const updatedRequest = await pool.query(updateRequestQuery, [status, id]);

        if (status === 'ACCEPTED') {
            // Update task as Assigned
            const updateTaskQuery = `
                UPDATE tasks
                SET status = 'ASSIGNED',
                    assignee_id = $1
                WHERE id = $2;
            `;
            await pool.query(updateTaskQuery, [request.requester_id, request.task_id]);

            // Create notification for requester
            const notificationQuery = `
                INSERT INTO notifications (user_id, body)
                VALUES ($1, $2);
            `;
            await pool.query(notificationQuery, [request.requester_id, 'Your request has been accepted.']);
        }

        res.status(200).json({
            message: `Request ${status.toLowerCase()} successfully`,
            request: updatedRequest.rows[0]
        });

    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ message: 'Server error while updating request' });
    }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
    const requesterId = req.user?.id;

    if (!requesterId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT r.*, t.title, t.location
            FROM requests r
            JOIN tasks t ON r.task_id = t.id
            WHERE r.requester_id = $1
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [requesterId]);

        res.status(200).json({
            requests: result.rows
        });
    } catch (error) {
        console.error('Error fetching my requests:', error);
        res.status(500).json({ message: 'Server error while fetching requests' });
    }
};

export const getReceivedRequests = async (req: AuthRequest, res: Response) => {
    const taskOwnerId = req.user?.id;

    if (!taskOwnerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT r.*, t.title, u.first_name, u.last_name
            FROM requests r
            JOIN tasks t ON r.task_id = t.id
            JOIN users u ON r.requester_id = u.id
            WHERE t.user_id = $1
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [taskOwnerId]);

        res.status(200).json({
            requests: result.rows
        });
    } catch (error) {
        console.error('Error fetching received requests:', error);
        res.status(500).json({ message: 'Server error while fetching received requests' });
    }
};
