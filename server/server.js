const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const taskRoutes = require("./routes/taskRoutes");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();
const app = express();


// ====================
// MIDDLEWARE
// ====================
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));


app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/tasks", taskRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user", userRoutes);


// ====================
// DATABASE CONNECTION
// ====================
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/HireHelperDB";

mongoose.connect(dbURI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.log("❌ DB Connection Error:", err));


// ====================
// USER MODEL
// ====================
const User = require("./models/User");


// ====================
// OTP SCHEMA
// ====================
const otpSchema = new mongoose.Schema({
  email_id: String,
  otp_code: String,
  created_at: {
    type: Date,
    default: Date.now,
    expires: 300   // 5 minutes
  }
});

const Otp = mongoose.model("Otp", otpSchema);


// ====================
// EMAIL TRANSPORTER
// ====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) console.log("Mail Error:", error);
  else console.log("📧 Mail server ready");
});


// ====================
// HELPER FUNCTIONS
// ====================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// ====================
// ROUTES
// ====================


// -------- REGISTER --------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email_id } = req.body;

    const existingUser = await User.findOne({ email_id });

    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ error: "Account already exists. Please login." });
    }

    if (existingUser && !existingUser.is_verified) {
      await User.deleteOne({ email_id });
      await Otp.deleteMany({ email_id });
    }

    const newUser = new User(req.body);
    await newUser.save();

    const otpCode = generateOTP();

    await Otp.create({ email_id, otp_code: otpCode });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email_id,
      subject: "HireHelper OTP Verification",
      text: `Your OTP is ${otpCode}. It will expire in 5 minutes.`
    });

    res.status(201).json({ message: "OTP Sent Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// -------- VERIFY OTP (Registration) --------
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email_id, otp } = req.body;

    const otpRecord = await Otp.findOne({ email_id, otp_code: otp });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await User.updateOne({ email_id }, { is_verified: true });
    await Otp.deleteMany({ email_id });

    res.json({ message: "Account verified successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// -------- LOGIN --------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email_id, password } = req.body;

    const user = await User.findOne({ email_id });

    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.is_verified)
      return res.status(400).json({ error: "Please verify your email first" });

    if (user.password !== password)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "hirehelpersecretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email_id: user.email_id,
        mobile_number: user.mobile_number,
        profile_picture: user.profile_picture,
        is_verified: user.is_verified
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// -------- FORGOT PASSWORD (Send OTP) --------
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email_id } = req.body;

    const user = await User.findOne({ email_id });
    if (!user) return res.status(400).json({ error: "User not found" });

    await Otp.deleteMany({ email_id });

    const otpCode = generateOTP();
    await Otp.create({ email_id, otp_code: otpCode });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email_id,
      subject: "HireHelper Password Reset OTP",
      text: `Your OTP is ${otpCode}. It expires in 5 minutes.`
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


// -------- VERIFY RESET OTP --------
app.post("/api/auth/verify-reset-otp", async (req, res) => {
  try {
    const { email_id, otp } = req.body;

    const otpRecord = await Otp.findOne({ email_id, otp_code: otp });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// -------- RESET PASSWORD --------
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email_id, otp, new_password } = req.body;

    const otpRecord = await Otp.findOne({ email_id, otp_code: otp });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await User.updateOne(
      { email_id },
      { $set: { password: new_password } }
    );

    await Otp.deleteMany({ email_id });

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ====================
// START SERVER
// ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
