// Models directory
// Place your database models/queries here
// Example: userModel.js, jobModel.js, applicationModel.js, etc.

/**
 * Example Model Structure:
 * 
 * const pool = require('../config/database');
 * 
 * const User = {
 *   findAll: async () => {
 *     const result = await pool.query('SELECT * FROM users');
 *     return result.rows;
 *   },
 * 
 *   findById: async (id) => {
 *     const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
 *     return result.rows[0];
 *   },
 * 
 *   create: async (userData) => {
 *     const { name, email, password } = userData;
 *     const result = await pool.query(
 *       'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
 *       [name, email, password]
 *     );
 *     return result.rows[0];
 *   }
 * };
 * 
 * module.exports = User;
 */
