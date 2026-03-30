const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// import db connection (IMPORTANT)
require("./config/db");
const { initDbSchema } = require("./config/initDb");

const app = express();
app.use(cors());
app.use(express.json());
 // app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Disabled for DB storage

initDbSchema()
  .then(() => console.log("Database schema ready"))
  .catch((err) => console.error("Schema init error:", err));

app.get("/", (req, res) => {
  res.send("HireHelper backend running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const verifyToken = require("./middleware/auth.Middleware");

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);
const requestRoutes = require("./routes/requestRoutes");
app.use("/api/requests", requestRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);
const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes);
