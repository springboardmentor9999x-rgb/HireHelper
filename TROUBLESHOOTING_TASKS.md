# Troubleshooting: My Tasks Not Showing

## Quick Diagnosis Steps

### Step 1: Check Backend Connection
Run the connection test:
```bash
cd backend
node testConnection.js
```

This will verify:
- ✅ Database connection is working
- ✅ Tables exist (users, tasks)
- ✅ How many tasks exist in the database

### Step 2: Check Backend Is Running
Ensure the backend server is running:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Email transporter ready (or warning if not configured)
🚀 Server running on http://localhost:5000
```

### Step 3: Check Browser Console
Open Developer Tools (F12) → Console tab:

Look for these messages:
- `📥 Loading tasks...` - Should appear when loading starts
- `✅ Tasks response received:` - Should show the response from API
- Any red error messages

### Step 4: Check Network Tab
In Developer Tools → Network tab:

1. Filter by "Fetch/XHR"
2. Look for a request to: `http://localhost:5000/api/tasks/my`
3. Check the response:
   - **Status should be 200 (Success)**
   - **Response should be JSON with "success: true" and "data: []"**

### Common Issues & Fixes

#### ❌ Error: "Connection error. Backend server may not be running"
**Solution:** Start the backend
```bash
cd backend
npm run dev
```

#### ❌ Error: "Unauthorized. Please log in again"
**Cause:** Token not being sent or is invalid
**Solution:** 
1. Log out and log back in
2. Clear browser localStorage
3. Check if auth interceptor is working

#### ❌ Error: Connection refused (Error: 0)
**Cause:** Backend server not accessible at localhost:5000
**Solution:**
```bash
# Make sure backend is running
cd backend
npm run dev

# Check if port 5000 is available
netstat -ano | findstr :5000
```

#### ✅ Status 200 but no tasks showing
**Cause:** No tasks created yet
**Solution:** 
1. Click "+ Add New Task"
2. Fill in the form and submit
3. Tasks should appear after creation

## Database Check

To see all tasks directly in the database:
```sql
SELECT * FROM tasks;
```

To see tasks for a specific user:
```sql
SELECT * FROM tasks WHERE user_id = 'user-id-here';
```

## API Manual Test

Test the API endpoint directly using curl:

```bash
# First, get a login token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Copy the token from the response

# Then fetch tasks
curl -X GET http://localhost:5000/api/tasks/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

You should get a response like:
```json
{
  "success": true,
  "data": [
    {
      "id": "task-123",
      "user_id": "user-123",
      "title": "First Task",
      "description": "Task description",
      "created_at": "2025-03-08T10:30:00Z"
    }
  ]
}
```

## Still Not Working?

1. **Check console logs** for error messages
2. **Check backend logs** when you created the task (should see messages)
3. **Verify database connection** with `node testConnection.js`
4. **Clear everything and try again:**
   - Delete tasks from database
   - Log out
   - Clear browser cache (Ctrl+Shift+Del)
   - Log back in
   - Try creating a new task

## Production Checklist

Before deploying:
- [ ] Backend API URL configured correctly (environment.ts)
- [ ] Database connection string correct (.env)
- [ ] JWT_SECRET set properly
- [ ] Email configured (if OTP needed)
- [ ] CORS properly configured
- [ ] Database tables created with correct schema
