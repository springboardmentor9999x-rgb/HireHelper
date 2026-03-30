const nodemailer = require("nodemailer");

// Email service configuration
let transporter;
let emailConfigured = false;

const initializeEmailService = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Check if credentials are valid (not placeholders)
  if (!emailUser || !emailPassword || 
      emailUser.includes('your-email') || 
      emailUser.includes('your_email') ||
      emailPassword.includes('xxxx') ||
      emailPassword.includes('your_app_password')) {
    console.warn('⚠️  Email credentials are not configured.');
    console.warn('   OTP emails will not be sent until you configure email.');
    console.warn('   See EMAIL_SETUP.md for instructions.');
    return null;
  }

  try {
    // Gmail SMTP transporter with optimized settings for better reliability
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // Connection settings optimized for development
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use TLS not SSL for port 587
      requireTLS: true,
      pool: false, // Disable pooling for development
      connectionUrl: undefined,
      connectionTimeout: 10000, // Increase timeout to 10s
      socketTimeout: 10000,
    });

    // Verify connection with longer timeout (non-blocking)
    setTimeout(() => {
      const verifyTimeout = setTimeout(() => {
        console.warn('⚠️  Email transporter verification timeout (10s).');
        console.warn('   ℹ️  This is common in development with slower networks.');
        console.warn('   ℹ️  Emails will still be sent when triggered.');
        console.warn('   💡 To fix: Check EMAIL_USER and EMAIL_PASSWORD in .env, or verify network connectivity.');
      }, 10000);

      transporter.verify((error, success) => {
        clearTimeout(verifyTimeout);
        if (error) {
          console.warn('⚠️  Email transporter warning:', error.message);
          console.warn('   ℹ️  Possible causes: Invalid credentials, 2FA not enabled, or firewall blocking.');
          console.warn('   ℹ️  Email sending may still work when triggered.');
        } else if (success) {
          emailConfigured = true;
          console.log('✅ Email transporter verified and ready');
        }
      });
    }, 200); // Increased delay

    return transporter;
  } catch (error) {
    console.warn('⚠️  Error initializing email service:', error.message);
    return null;
  }
};

// Initialize on module load
transporter = initializeEmailService();

// Send OTP verification email
const sendOTPEmail = async (toEmail, otp, firstName, type = 'verification') => {
  try {
    if (!transporter) {
      throw new Error(
        'Email service not configured. Update EMAIL_USER and EMAIL_PASSWORD in .env file. See EMAIL_SETUP.md for instructions.'
      );
    }

    const isPasswordReset = type === 'Password Reset' || type === 'password-reset';
    const subject = isPasswordReset ? 'Reset your HireHelper password' : 'Verify your HireHelper account';
    const heading = isPasswordReset ? 'Reset Your Password' : 'Verify Your Account';
    const message = isPasswordReset 
      ? 'Please use the code below to reset your password:'
      : 'Thank you for signing up for HireHelper. Please use the code below to verify your email address:';
    const footerMessage = isPasswordReset 
      ? 'If you did not request a password reset, please ignore this email.'
      : 'If you did not request this code, please ignore this email.';

    const mailOptions = {
      from: `"HireHelper" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">HireHelper</h1>
          </div>
          <div style="padding: 30px; background: #f7f9fc; border-radius: 10px; margin-top: 10px;">
            <h2 style="color: #1a1a1a; text-align: center;">${heading}</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hi ${firstName || 'there'},<br><br>
              ${message}
            </p>
            <div style="background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h1 style="color: #3b82f6; font-size: 2rem; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #555; font-size: 14px;">
              <strong>Code expires in 5 minutes.</strong> Do not share this code with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              ${footerMessage}<br>
              © 2025 HireHelper. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (toEmail, resetLink, firstName) => {
  try {
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"HireHelper" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Reset your HireHelper password",
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">HireHelper</h1>
          </div>
          <div style="padding: 30px; background: #f7f9fc; border-radius: 10px; margin-top: 10px;">
            <h2 style="color: #1a1a1a; text-align: center;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hi ${firstName || 'there'},<br><br>
              Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #555; font-size: 14px;">
              <strong>Link expires in 1 hour.</strong> If you didn't request a password reset, ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${toEmail}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = { 
  sendOTPEmail,
  sendPasswordResetEmail,
  initializeEmailService 
};