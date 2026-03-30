import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const createTask = async (req: AuthRequest, res: Response) => {
    const { title, description, location, start_time, end_time, picture_url, category } = req.body;
    const userId = req.user.id;

    if (!title || !start_time || !location) {
        return res.status(400).json({ message: 'Title, Start Time, and Location are required fields.' });
    }

    try {
        console.log(`Creating task for user: ${userId}`);
        const query = `
            INSERT INTO tasks (user_id, title, description, location, start_time, end_time, picture_url, status, category)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [
            userId,
            title,
            description || null,
            location,
            start_time,
            end_time || null,
            picture_url || null,
            'OPEN',
            category || 'Other'
        ];
        const result = await pool.query(query, values);
        console.log('Task created successfully:', result.rows[0]);

        res.status(201).json({
            message: 'Task created successfully',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error while creating task' });
    }
};

export const getMyTasks = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (userId === undefined || userId === null) {
        return res.status(401).json({ message: 'Unauthorized: User ID missing from token' });
    }

    try {
        const query = `
            SELECT * FROM tasks 
            WHERE user_id = $1::integer 
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query, [userId]);

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.status(200).json({
            tasks: result.rows
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks' });
    }
};
export const getFeedTasks = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { q, category } = req.query;

    try {
        let query = `
            SELECT * FROM tasks 
            WHERE user_id != $1::integer 
            AND status = 'OPEN'
        `;
        const values: any[] = [userId || -1];

        if (q) {
            values.push(`%${q}%`);
            query += ` AND (title ILIKE $${values.length} OR description ILIKE $${values.length})`;
        }

        if (category && category !== 'All') {
            values.push(category);
            query += ` AND category = $${values.length}`;
        }

        query += ` ORDER BY created_at DESC;`;

        const result = await pool.query(query, values);

        res.status(200).json({
            tasks: result.rows
        });
    } catch (error) {
        console.error('Error fetching feed tasks:', error);
        res.status(500).json({ message: 'Server error while fetching feed tasks' });
    }
};

export const markTaskAsCompleted = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const query = `
            UPDATE tasks
            SET status = 'COMPLETED'
            WHERE id = $1 AND assignee_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized: You are not the assignee for this task' });
        }

        res.status(200).json({ message: 'Task marked as completed', task: result.rows[0] });
    } catch (error) {
        console.error('Error marking task as completed:', error);
        res.status(500).json({ message: 'Server error while marking task as completed' });
    }
};

export const verifyTaskCompletion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const query = `
            UPDATE tasks
            SET status = 'VERIFIED', is_verified = TRUE
            WHERE id = $1 AND user_id = $2 AND status = 'COMPLETED'
            RETURNING *;
        `;
        const result = await pool.query(query, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or task not completed yet' });
        }

        res.status(200).json({ message: 'Task verified successfully', task: result.rows[0] });
    } catch (error) {
        console.error('Error verifying task:', error);
        res.status(500).json({ message: 'Server error while verifying task' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { title, description, location, start_time, end_time, picture_url, category } = req.body;

    if (!title || !start_time || !location) {
        return res.status(400).json({ message: 'Title, Start Time, and Location are required fields.' });
    }

    try {
        // Only the owner can edit, and only when the task is still OPEN
        const query = `
            UPDATE tasks
            SET title = $1, description = $2, location = $3,
                start_time = $4, end_time = $5, picture_url = $6, category = $7
            WHERE id = $8 AND user_id = $9 AND status = 'OPEN'
            RETURNING *;
        `;
        const values = [
            title,
            description || null,
            location,
            start_time,
            end_time || null,
            picture_url || null,
            category || 'Other',
            id,
            userId
        ];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or task cannot be edited in its current state.' });
        }

        res.status(200).json({ message: 'Task updated successfully', task: result.rows[0] });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task' });
    }
};
