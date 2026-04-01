const db = require('../config/db');

exports.sendMessage = async (req, res) => {
  const { task_id, receiver_id, message } = req.body;

  try {
   
    await db.query(
      `INSERT INTO messages (task_id, sender_id, receiver_id, message)
       VALUES ($1,$2,$3,$4)`,
      [task_id, req.user.id, receiver_id, message]
    );

  
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, type, message, task_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiver_id,        
        req.user.id,        
        'chat',                         
        message,            
        task_id             
      ]
    );

    res.status(200).json({ message: "Message sent" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getMessages = async (req, res) => {
  const { task_id, user_id } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM messages
       WHERE task_id = $1 
       AND (sender_id = $2 OR receiver_id = $2)
       ORDER BY created_at ASC`,
      [task_id, user_id]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};