const pool = require('../config/database');
const { HTTP_CODES, MESSAGES } = require('../config/constants');

/**
 * Example Controller
 * This is a template for creating controllers following MVC pattern
 */

const exampleController = {
  /**
   * Get all items
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM example_table');
      res.status(HTTP_CODES.OK).json({
        success: true,
        message: MESSAGES.SUCCESS,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Get item by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM example_table WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: MESSAGES.SUCCESS,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Create new item
   */
  create: async (req, res) => {
    try {
      const { name, email } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Name and email are required',
        });
      }

      const result = await pool.query(
        'INSERT INTO example_table (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );

      res.status(HTTP_CODES.CREATED).json({
        success: true,
        message: MESSAGES.SUCCESS,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Update item
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const result = await pool.query(
        'UPDATE example_table SET name = $1, email = $2 WHERE id = $3 RETURNING *',
        [name, email, id]
      );

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: MESSAGES.SUCCESS,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },

  /**
   * Delete item
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM example_table WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }

      res.status(HTTP_CODES.OK).json({
        success: true,
        message: 'Item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR,
        error: error.message,
      });
    }
  },
};

module.exports = exampleController;
