// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email_id, mobile_number, password } = req.body;

    if (!first_name || !last_name || !email_id || !mobile_number || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await userService.findUserByEmail(email_id);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const newUser = {
      first_name,
      last_name,
      email_id,
      mobile_number,
      password: hashedPassword,
      otp, // registration OTP
      isVerified: false
    };

    await userService.createUser(newUser);

    console.log("Registration OTP:", otp);

    res.status(201).json({
      message: "Registered successfully. OTP sent."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY OTP (FOR REGISTRATION) =================
exports.verifyOtp = async (req, res) => {
  try {
    const { email_id, otp } = req.body;

    const user = await userService.findUserByEmail(email_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    await userService.updateUser(email_id, {
      isVerified: true,
      otp: null // clear OTP after registration verification
    });

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email_id, password } = req.body;

    const user = await userService.findUserByEmail(email_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Please verify account first" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { email: user.email_id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email_id } = req.body;

    const user = await userService.findUserByEmail(email_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();

    // Store OTP specifically for password reset
    await userService.updateUser(email_id, { resetOtp: otp });

    console.log("Password Reset OTP:", otp);

    res.json({ message: "Reset OTP sent" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY OTP FOR PASSWORD RESET =================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email_id, otp } = req.body;

    const user = await userService.findUserByEmail(email_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email_id, otp, new_password } = req.body;

    const user = await userService.findUserByEmail(email_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Save new password and clear reset OTP
    await userService.updateUser(email_id, {
      password: hashedPassword,
      resetOtp: null
    });

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
