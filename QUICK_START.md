# HireHelper Tasks Feature - Quick Start Guide

## ⚡ Quick Start (5 minutes)

### Prerequisites
- PostgreSQL running with database configured
- Node.js and npm installed
- Angular CLI (optional, not needed if using npm start)

### Step 1: Initialize Database (1 minute)

```bash
cd backend
node database-schema.js
```

**Expected output:**
```
📊 Initializing database schema...
✅ Tasks table created successfully

📋 Tasks Table Schema:
──────────────────────────────────────────────
  id                 integer
  user_id            integer
  title              character varying
  description        text
  location           character varying
  start_time         timestamp without time zone
  end_time           timestamp without time zone
  status             character varying
  priority           character varying
  due_date           timestamp without time zone
  image              character varying
  picture            character varying
  created_at         timestamp without time zone
  updated_at         timestamp without time zone
──────────────────────────────────────────────

✅ Database initialization complete!
```

### Step 2: Start Backend Server (1 minute)

```bash
# From backend directory
npm run dev
```

**Expected output:**
```
✓ Database connected to PostgreSQL
[2026-03-10T...] Server is running on port 5000

╔════════════════════════════════════╗
║     HireHelper Backend Server      ║
║     🚀 Server Running              ║
║     Port: 5000                     ║
║     Environment: development       ║
╚════════════════════════════════════╝
```

### Step 3: Start Frontend Server (1 minute)

```bash
# From frontend directory (new terminal)
npm start
```

**Expected output:**
```
✔ Your application is running here: http://localhost:4300
```

### Step 4: Test the Application (2 minutes)

1. Open browser to http://localhost:4300
2. Log in with test credentials
3. Click "My Tasks" - should load (may be empty)
4. Click "+ Add New Task"
5. Fill in:
   - Title: "Test Task"
   - Description: "This is a test task for the tasks feature"
   - Optionally add location and times
6. Click "Create Task"
7. Should redirect back to My Tasks and show the new task

---

## 🎯 Testing Checklist

### Create Task Test
- [ ] Navigate to My Tasks
- [ ] Click "+ Add New Task"
- [ ] Enter title (minimum 3 chars)
- [ ] Enter description (minimum 10 chars)
- [ ] Click "Create Task"
- [ ] See success message
- [ ] Redirect to My Tasks
- [ ] New task appears in list

### Display Tasks Test
- [ ] Click "My Tasks"
- [ ] See "Loading tasks..." or task list
- [ ] Each task shows: title, description, location, times
- [ ] Tasks displayed in card grid layout
- [ ] No console errors

### Delete Task Test
- [ ] In My Tasks, click "Delete" on a task
- [ ] Confirm in dialog
- [ ] See "Task deleted successfully!"
- [ ] Task disappears from list
- [ ] Refresh page - task is gone

### Image Upload Test
- [ ] Go to Add Task
- [ ] Select image file
- [ ] See image preview
- [ ] Create task
- [ ] In My Tasks, verify image displays
- [ ] On image error, task still shows

### Error Handling Test
- [ ] Try to create task without title → See error
- [ ] Try to create task with short description → See error
- [ ] Disconnect backend, try to load tasks → See error message
- [ ] Log out and try to access My Tasks → Redirect to login

---

## 🔧 Troubleshooting

### "Loading tasks..." doesn't stop

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for GET request to `http://localhost:5000/api/tasks/my-tasks`
4. Check response status and body

**If 401 Unauthorized:**
- Your token expired
- Solution: Log in again

**If 404 Not Found:**
- Backend route not found
- Solution: Check routes are in correct order in tasks.js

**If 0 (Network Error):**
- Backend not running
- Solution: Start backend with `npm run dev`

### Tasks don't display but page loads

**Check:**
1. Are you logged in? (Check localStorage in DevTools)
2. Does backend respond with valid JSON?
3. Check console for JavaScript errors

**Debug:**
```javascript
// In browser console
fetch('http://localhost:5000/api/tasks/my-tasks', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(d => console.log(d))
```

### Image doesn't upload

**Check:**
1. Is file size reasonable? (< 5MB)
2. Is file format supported? (jpg, png, gif)
3. Does `backend/uploads/` directory exist?

**Debug:**
1. Check browser console for error
2. Check backend logs for upload errors
3. Verify multer middleware is configured

### Database connection error

**Check:**
1. Is PostgreSQL running?
2. Are .env credentials correct?
3. Does database exist?

**Test connection:**
```bash
psql -U <DB_USER> -d <DB_NAME> -h <DB_HOST>
# Should be able to connect
```

### JWT token expired

**Solution:**
Simply log out and log in again. The authenticateToken middleware will return 401 if token is expired, and the interceptor can handle redirecting to login.

---

## 📁 Project Structure Review

```
hirehelper_project/
├── backend/
│   ├── database-schema.js          ← Run this first!
│   ├── db.js                       ← Database pool
│   ├── server.js                   ← Main server
│   ├── routes/
│   │   └── tasks.js                ← Task endpoints (CORRECT ORDER)
│   ├── middleware/
│   │   ├── auth.js                 ← JWT verification
│   │   └── uploadMiddleware.js     ← Multer config
│   └── uploads/                    ← Image storage
│
├── frontend/
│   └── src/app/
│       ├── environments/
│       │   └── environment.ts       ← Set to http://localhost:5000/api
│       ├── services/
│       │   ├── task.service.ts      ← API calls
│       │   └── http.interceptor.ts  ← JWT auto-inject
│       ├── components/
│       │   ├── pages/
│       │   │   ├── my-tasks/        ← Task list page
│       │   │   └── add-task/        ← Create task page
│       │   └── tasks/               ← Reusable component
│       └── app.routes.ts            ← Routes config
│
└── Documentation/
    ├── TASKS_IMPLEMENTATION.md      ← Full guide
    ├── ARCHITECTURE.md              ← Technical details
    └── QUICK_START.md               ← This file
```

---

## 🚀 Performance Optimization Tips

### For Better Performance:

1. **Add pagination to task list** (for large lists)
   ```typescript
   getMyTasks(page: number = 1, limit: number = 10): Observable<...> {
     return this.http.get(`${this.baseUrl}/my-tasks?page=${page}&limit=${limit}`);
   }
   ```

2. **Add lazy loading for images**
   ```html
   <img loading="lazy" [src]="task.image" alt="Task">
   ```

3. **Implement virtual scrolling** for hundreds of tasks
   ```typescript
   // Use CDK virtual scroll
   import { ScrollingModule } from '@angular/cdk/scrolling';
   ```

4. **Add caching for task list**
   ```typescript
   tasks$ = this.http.get(...).pipe(shareReplay(1));
   ```

---

## 📋 API Endpoints Quick Reference

### Task Endpoints
| Method | Endpoint | Authentication | Response |
|--------|----------|----------------|----------|
| POST | `/api/tasks` | ✅ Required | 201 + task |
| GET | `/api/tasks/my-tasks` | ✅ Required | 200 + tasks[] |
| GET | `/api/tasks/:id` | ✅ Required | 200 + task |
| PUT | `/api/tasks/:id` | ✅ Required | 200 + task |
| DELETE | `/api/tasks/:id` | ✅ Required | 200 + message |

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json  (or multipart/form-data for file upload)
```

### Example Request
```bash
curl -X GET http://localhost:5000/api/tasks/my-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "title": "Test Task",
      "description": "This is a test task",
      "location": "Office",
      "start_time": "2026-03-10T09:00:00",
      "end_time": "2026-03-10T17:00:00",
      "status": "OPEN",
      "priority": "medium",
      "picture": null,
      "created_at": "2026-03-10T08:30:00Z"
    }
  ]
}
```

---

## 🔒 Security Reminders

- ✅ Never commit `.env` file to git
- ✅ Keep JWT_SECRET strong and private
- ✅ Always validate user_id on backend
- ✅ Use HTTPS in production
- ⚠️ Implement rate limiting before deploying
- ⚠️ Consider CSRF protection for forms
- ⚠️ Sanitize file uploads

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs:**
   - Frontend: Browser DevTools Console (F12)
   - Backend: Terminal where `npm run dev` is running

2. **Review documentation:**
   - See `TASKS_IMPLEMENTATION.md` for full details
   - See `ARCHITECTURE.md` for technical deep dive

3. **Test the API directly:**
   - Use curl or Postman
   - Make requests to http://localhost:5000/api/tasks/my-tasks
   - Head to "Troubleshooting" section above

4. **Database debugging:**
   ```bash
   psql -U <user> -d <database>
   SELECT * FROM tasks;
   ```

---

**Ready to go!** 🎉

Follow the Quick Start above and you should have a fully functional Tasks feature. If you hit any issues, check Troubleshooting or review the full documentation files.
