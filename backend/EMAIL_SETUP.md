# Email Configuration Guide for HireHelper OTP

## Problem
Users are not receiving OTP emails for account verification.

## Root Cause
The `.env` file has placeholder credentials for Gmail SMTP. You need to configure real email credentials.

## Solution: Using Gmail (Recommended)

### Step 1: Set Up Gmail Account
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Visit https://myaccount.google.com/apppasswords
2. Select **Mail** from the "Select app" dropdown
3. Select **Windows Computer** (or your device) from the "Select device" dropdown
4. Click **Generate**
5. Google will show you a 16-character password (looks like: `xxxx xxxx xxxx xxxx`)
6. Copy this password

### Step 3: Update .env File
Open `backend/.env` and replace:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**IMPORTANT:** Remove the spaces from the password when pasting it into `.env`

**Example:**
```
EMAIL_USER=myproject@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

DO NOT use: `EMAIL_PASSWORD=abcd efgh ijkl mnop` (Gmail displays it with spaces for readability, but nodemailer needs it without spaces)

### Step 4: Test
1. Restart the backend server: `npm run dev`
2. Try registering a new account
3. Check your email inbox for the OTP

## Troubleshooting

### "Email service not configured" error
- Your EMAIL_USER or EMAIL_PASSWORD contains placeholder values
- Follow the steps above to generate a real app password

### "getaddrinfo ENOTFOUND smtp.gmail.com" Error
**This is a network connectivity issue, NOT a credential problem.**

1. **Check Internet Connection**
   - Ensure your network is connected and working
   - Try accessing https://mail.google.com in your browser

2. **Check Firewall/Proxy**
   - Your network may block SMTP port 465/587
   - If behind corporate firewall, contact your IT admin
   - Check if VPN is needed

3. **DNS Issue**
   - Try flushing DNS: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
   - Try changing DNS to 8.8.8.8 (Google's DNS)

4. **For Development/Testing**
   - Use Mailtrap (see Alternative below) which has more relaxed network requirements
   - Or test with a simple ping first: `node -e "require('dns').lookup('smtp.gmail.com', (err, address) => console.log(err ? 'FAILED: ' + err.message : 'OK: ' + address))"`

5. **Verify Gmail Account**
   - Make sure 2-Step Verification is still enabled
   - Check that the app password was generated correctly
   - Try generating a NEW app password and updating `.env`

### Emails not arriving
1. Check **Spam/Promotions** folder in Gmail
2. Check backend console for errors (look for ❌ marks)
3. Verify EMAIL_USER has 2-Step Verification enabled
4. Make sure you used an App Password, not your regular password

### SMTP Connection Error (after confirming network works)
- Wait a few minutes and try again
- Verify your internet connection
- Check that 2-Step Verification is enabled

## Alternative: Using Mailtrap (for Testing)

If you don't want to use your Gmail account:

1. Sign up at https://mailtrap.io (free tier available)
2. Create a new inbox
3. Get SMTP credentials
4. Update `.env` to use Mailtrap instead (coming soon - will update emailService.js)

## Security Notes
- Never commit real credentials to Git
- Use environment variables for production
- The 16-character app password is safer than your main Gmail password
- You can revoke app passwords anytime in Google Account settings
