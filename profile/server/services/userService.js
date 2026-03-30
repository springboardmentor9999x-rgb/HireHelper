// services/userService.js

// Temporary in-memory storage
let users = [];

// Find user by email_id
exports.findUserByEmail = async (email_id) => {
  return users.find(user => user.email_id === email_id);
};

// Create user
exports.createUser = async (userData) => {
  users.push(userData);
  return userData;
};

// Update user
exports.updateUser = async (email_id, updatedData) => {
  const index = users.findIndex(user => user.email_id === email_id);

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedData };
    return users[index];
  }

  return null;
};
