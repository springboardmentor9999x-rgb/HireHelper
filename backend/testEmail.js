require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  // Check if credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("❌ Email credentials not configured in .env file");
    console.error("Please follow the setup guide: See EMAIL_SETUP.md\n");
    process.exit(1);
  }

  if (process.env.EMAIL_USER === "your-email@gmail.com") {
    console.error("❌ Still using placeholder credential:");
    console.error(`   EMAIL_USER: ${process.env.EMAIL_USER}\n`);
    console.error("Please update your .env file with real credentials.\n");
    process.exit(1);
  }

  try {
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log("⏳ Connecting to Gmail SMTP...\n");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    console.log("🔍 Verifying transporter...");
    await transporter.verify();
    console.log("✅ Transporter is ready\n");

    // Send test email
    console.log("📤 Sending test email...");
    const info = await transporter.sendMail({
      from: `"HireHelper Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🧪 Test Email - HireHelper",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 Success!</h2>
          <p>Your email configuration is working correctly.</p>
          <p>OTP emails should now be delivered when users register.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from HireHelper backend.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log(`📨 Message ID: ${info.messageId}\n`);
    console.log("✨ Your email configuration is ready!");
    console.log("You can now register users and they will receive OTP emails.\n");
  } catch (error) {
    console.error("❌ Email test failed!");
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes("Invalid login")) {
      console.error("💡 Possible solutions:");
      console.error("   1. Make sure EMAIL_PASSWORD is a 16-char App Password");
      console.error("   2. Verify 2-Step Authentication is enabled on Google Account");
      console.error("   3. Check that EMAIL_USER is correct\n");
    }
    
    process.exit(1);
  }
}

testEmail();