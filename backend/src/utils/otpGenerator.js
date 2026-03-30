/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate OTP expiry time (current time + minutes)
 */
const getOTPExpiry = (minutes = 5) => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
};

module.exports = {
  generateOTP,
  getOTPExpiry,
};
