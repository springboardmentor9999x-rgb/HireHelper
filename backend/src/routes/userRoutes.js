const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

let users = [];

// REGISTER
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields required"
    });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password
  };

  users.push(user);

  res.json({
    success: true,
    message: "User registered successfully",
    user
  });
});


// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    "secretkey",
    { expiresIn: "1h" }
  );

  res.json({
    success: true,
    token
  });
});


// AUTH MIDDLEWARE
function auth(req, res, next) {

  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      success: false,
      message: "Token required"
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}


// GET PROFILE
router.get('/me', auth, (req, res) => {

  const user = users.find(u => u.id === req.user.id);

  res.json({
    success: true,
    user
  });

});


// UPDATE USER
router.put('/update', auth, (req, res) => {

  const { name } = req.body;

  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false
    });
  }

  user.name = name || user.name;

  res.json({
    success: true,
    message: "User updated successfully",
    user
  });

});

module.exports = router;