const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (emailId, otp) => {
  await transporter.sendMail({
    from: "HireHelper <snehalmpatil2004@gmail.com>",
    to: emailId,
    subject: "OTP Verification",
    html: `<h3>Your OTP: ${otp}</h3><p>Valid for 5 minutes</p>`
  });
};

const sendPasswordResetEmail = async (emailId, otp) => {
  await transporter.sendMail({
    from: "HireHelper <snehalmpatil2004@gmail.com>",
    to: emailId,
    subject: "Password Reset OTP",
    html: `<h3>Password reset OTP: ${otp}</h3><p>Use this OTP within 5 minutes to reset your password.</p>`
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email_id, password, phone_number, profile_picture } = req.body;

    if (!first_name || !last_name || !email_id || !password || !phone_number) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userCheck = await pool.query(
      "SELECT id, is_verified FROM users WHERE email_id=$1",
      [email_id]
    );

    const otp = createOtp();
    const expiry = new Date(Date.now() + 5 * 60000);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];

      if (existingUser.is_verified) {
        return res.json({ message: "User already exists", alreadyExists: true });
      }

      await pool.query(
        `UPDATE users
         SET first_name=$1,
             last_name=$2,
             password=$3,
             phone_number=$4,
             profile_picture=$5,
             otp=$6,
             otp_expiry=$7
         WHERE email_id=$8`,
        [first_name, last_name, hashedPassword, phone_number, profile_picture || null, otp, expiry, email_id]
      );

      await sendOtpEmail(email_id, otp);
      return res.json({ message: "OTP resent to email" });
    }

    await pool.query(
      `INSERT INTO users(first_name,last_name,email_id,password,phone_number,profile_picture,otp,otp_expiry)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [first_name, last_name, email_id, hashedPassword, phone_number, profile_picture || null, otp, expiry]
    );

    try {
      await sendOtpEmail(email_id, otp);
    } catch (mailError) {
      await pool.query(
        "DELETE FROM users WHERE email_id=$1 AND is_verified=false",
        [email_id]
      );
      throw mailError;
    }

    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send OTP email" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email_id, otp } = req.body;

    if (!email_id || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await pool.query(
      "SELECT otp, otp_expiry, is_verified FROM users WHERE email_id=$1",
      [email_id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbUser = user.rows[0];

    if (dbUser.is_verified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (!dbUser.otp || dbUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!dbUser.otp_expiry || new Date() > dbUser.otp_expiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await pool.query(
      `UPDATE users
       SET is_verified=true, otp=NULL, otp_expiry=NULL
       WHERE email_id=$1`,
      [email_id]
    );

    return res.json({ message: "Account verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await pool.query(
      "SELECT * FROM users WHERE email_id=$1",
      [email_id]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.rows[0].is_verified) {
      return res.status(403).json({ message: "Please verify OTP first" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const safeUser = {
      id: user.rows[0].id,
      first_name: user.rows[0].first_name,
      last_name: user.rows[0].last_name,
      email_id: user.rows[0].email_id,
      phone_number: user.rows[0].phone_number,
      is_verified: user.rows[0].is_verified,
      profile_picture: user.rows[0].profile_picture,
      profession: user.rows[0].profession,
      interests: user.rows[0].interests,
      experience_years: user.rows[0].experience_years,
      skills: user.rows[0].skills,
      bio: user.rows[0].bio,
      city: user.rows[0].city,
      availability: user.rows[0].availability
    };

    return res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email_id } = req.body;

    if (!email_id) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await pool.query(
      "SELECT id, is_verified FROM users WHERE email_id=$1",
      [email_id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.rows[0].is_verified) {
      return res.status(403).json({ message: "Please verify your account first" });
    }

    const otp = createOtp();
    const expiry = new Date(Date.now() + 5 * 60000);

    await pool.query(
      `UPDATE users
       SET otp=$1, otp_expiry=$2
       WHERE email_id=$3`,
      [otp, expiry, email_id]
    );

    await sendPasswordResetEmail(email_id, otp);

    return res.json({ message: "Password reset OTP sent to your email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send password reset OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email_id, otp, password } = req.body;

    if (!email_id || !otp || !password) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }

    const user = await pool.query(
      "SELECT id, otp, otp_expiry FROM users WHERE email_id=$1",
      [email_id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbUser = user.rows[0];

    if (!dbUser.otp || dbUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!dbUser.otp_expiry || new Date() > dbUser.otp_expiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET password=$1, otp=NULL, otp_expiry=NULL
       WHERE email_id=$2`,
      [hashedPassword, email_id]
    );

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different" });
    }

    const user = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashedPassword, req.user.id]
    );

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

