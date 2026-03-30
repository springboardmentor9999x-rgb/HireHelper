const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, mobile_number } = req.body;

    const updateFields = {};
    if (first_name) updateFields.first_name = first_name;
    if (last_name) updateFields.last_name = last_name;
    if (mobile_number) updateFields.mobile_number = mobile_number;

    // Handle profile picture upload
    if (req.file) {
      updateFields.profile_picture = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      {returnDocument: 'after' } 
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
