import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const createReview = async (req: AuthRequest, res: Response) => {
    const { task_id, reviewee_id, rating, comment } = req.body;
    const reviewerId = req.user?.id;

    if (!task_id || !reviewee_id || !rating) {
        return res.status(400).json({ message: 'Task ID, Reviewee ID, and Rating are required.' });
    }

    try {
        // Validate: Task must be VERIFIED
        const taskQuery = 'SELECT status FROM tasks WHERE id = $1';
        const taskResult = await pool.query(taskQuery, [task_id]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (taskResult.rows[0].status !== 'VERIFIED') {
            return res.status(400).json({ message: 'Task must be verified before leaving a review.' });
        }

        // Check if review already exists from this reviewer for this task
        const duplicateQuery = 'SELECT * FROM reviews WHERE task_id = $1 AND reviewer_id = $2';
        const duplicateResult = await pool.query(duplicateQuery, [task_id, reviewerId]);

        if (duplicateResult.rows.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this task.' });
        }

        const insertQuery = `
            INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [task_id, reviewerId, reviewee_id, rating, comment || null]);

        res.status(201).json({ message: 'Review submitted successfully', review: result.rows[0] });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Server error while creating review' });
    }
};

export const getReviewsGivenByUser = async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    try {
        const query = `
            SELECT r.*, u.first_name, u.last_name, t.title as task_title
            FROM reviews r
            JOIN users u ON r.reviewee_id = u.id
            JOIN tasks t ON r.task_id = t.id
            WHERE r.reviewer_id = $1::integer
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);

        res.status(200).json({ reviews: result.rows });
    } catch (error) {
        console.error('Error fetching given reviews:', error);
        res.status(500).json({ message: 'Server error while fetching given reviews' });
    }
};

export const getReviewsForUser = async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    try {
        const query = `
            SELECT r.*, u.first_name, u.last_name, t.title as task_title
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            JOIN tasks t ON r.task_id = t.id
            WHERE r.reviewee_id = $1::integer
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);

        res.status(200).json({ reviews: result.rows });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error while fetching reviews' });
    }
};
