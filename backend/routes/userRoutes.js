const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.Middleware");
const { getMe, updateMe } = require("../controllers/userController");

router.get("/me", verifyToken, getMe);
router.put("/me", verifyToken, updateMe);

module.exports = router;
