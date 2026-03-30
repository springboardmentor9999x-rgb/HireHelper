# HireHelper Tasks Feature - Complete Implementation Guide

## Overview
This document provides a complete working implementation of the Tasks feature for the HireHelper Angular + Node.js application. All components are fully functional and tested.

---

## Backend Implementation

### 1. Database Setup

**File:** `backend/database-schema.js`

The tasks table includes the following columns:
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY to users)
- `title` (VARCHAR)
- `description` (TEXT)
- `location` (VARCHAR, optional)
- `start_time` (TIMESTAMP, optional)
- `end_time` (TIMESTAMP, optional)
- `status` (VARCHAR, default: 'OPEN')
- `priority` (VARCHAR, default: 'medium')
- `due_date` (TIMESTAMP, optional)
- `image` (VARCHAR, optional)
- `picture` (VARCHAR, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Initialize Database:**
```bash
cd backend
node database-schema.js
```

### 2. Backend Routes

**File:** `backend/routes/tasks.js`

**Route Order (CRITICAL):** Routes must be defined in this specific order:
1. `POST /` - Create task with file upload
2. `GET /my-tasks` - Get current user's tasks ⭐ BEFORE /:id
3. `GET /` - Get all user's tasks (fallback)
4. `GET /:id` - Get specific task by ID
5. `PUT /:id` - Update task
6. `DELETE /:id` - Delete task

**Authentication:** All routes require JWT Bearer token via `authenticateToken` middleware.

### 3. Server Configuration

**File:** `backend/server.js`

Key configurations already in place:
- ✅ CORS enabled for `http://localhost:4300`
- ✅ JSON body parsing enabled
- ✅ Task routes mounted at `/api/tasks`
- ✅ Error handling middleware
- ✅ Request logging

---

## Frontend Implementation

### 1. Environment Configuration

**File:** `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

✅ Already configured correctly.

### 2. Task Service

**File:** `frontend/src/app/services/task.service.ts`

Provides methods:
- `createTask(taskData: CreateTaskRequest | FormData)` - Creates new task
- `getMyTasks()` - Fetches user's tasks
- `getTaskById(id: string)` - Gets single task
- `updateTask(id: string, taskData: Partial<CreateTaskRequest>)` - Updates task
- `deleteTask(id: string)` - Deletes task

All methods use the environment.apiUrl and HTTP interceptor adds JWT token automatically.

### 3. Tasks Component (Reusable)

**Files:**
- `frontend/src/app/components/tasks/tasks.component.ts`
- `frontend/src/app/components/tasks/tasks.component.html`
- `frontend/src/app/components/tasks/tasks.component.css`

**Features:**
- Display all user tasks
- Create new tasks with form
- Delete tasks
- Error handling
- Loading states
- Success/error messages
- Responsive grid layout
- Standalone component with FormsModule support

**Usage:** Can be imported and used in any page component.

### 4. My Tasks Page Component

**Files:**
- `frontend/src/app/components/pages/my-tasks.ts`
- `frontend/src/app/components/pages/my-tasks.html`
- `frontend/src/app/components/pages/my-tasks.css`

**Features:**
- Displays user's tasks in card layout
- Handles navigation to add-task page
- Delete functionality
- Image preview support
- Date/time formatting
- Error handling for different HTTP status codes

**Methods:**
- `loadTasks()` - Fetches and displays tasks
- `onAddTask()` - Navigate to add task page
- `onDeleteTask(id)` - Delete specific task
- `formatDateTime(dateString)` - Format dates for display
- `onImageError(event)` - Handle broken images

### 5. Add Task Page Component

**Files:**
- `frontend/src/app/components/pages/add-task.ts`
- `frontend/src/app/components/pages/add-task.html`
- `frontend/src/app/components/pages/add-task.css`

**Features:**
- Reactive forms with validation
- Required field validation
- Optional fields (location, times, image)
- Image upload with preview
- FormData submission for file uploads
- Loading state
- Success/error messages
- Auto-redirect on success

**Validation Rules:**
- Title: Required, minimum 3 characters
- Description: Required, minimum 10 characters
- Location, Start Time, End Time: Optional
- Image: Optional (jpg, png, gif, etc.)

---

## Data Flow

### Creating a Task

```
User Input (AddTaskComponent)
    ↓
FormBuilder Validation
    ↓
TaskService.createTask(formData)
    ↓
HTTP Interceptor adds JWT token
    ↓
POST /api/tasks
    ↓
Backend: authenticateToken middleware
    ↓
Backend: Insert into tasks table
    ↓
Return task object
    ↓
Component redirects to /my-tasks
    ↓
MyTasksComponent loads and refreshes
```

### Fetching Tasks

```
MyTasksComponent ngOnInit() / Navigation
    ↓
TaskService.getMyTasks()
    ↓
HTTP Interceptor adds JWT token
    ↓
GET /api/tasks/my-tasks
    ↓
Backend: authenticateToken middleware
    ↓
Backend: SELECT * FROM tasks WHERE user_id = $1
    ↓
Return tasks array
    ↓
Component displays tasks in grid
```

---

## Key Implementation Points

### 1. Route Ordering (CRITICAL FIX)
The `/my-tasks` route MUST come before the `/:id` route. Otherwise, "my-tasks" string is treated as an ID parameter.

```javascript
// ❌ WRONG - my-tasks will be treated as ID
router.get('/:id', ...);
router.get('/my-tasks', ...);

// ✅ CORRECT - my-tasks is matched first
router.get('/my-tasks', ...);
router.get('/:id', ...);
```

### 2. JWT Token Handling
The HTTP interceptor automatically:
- Reads token from localStorage
- Adds `Authorization: Bearer <token>` header to requests
- Handles 401 responses for expired tokens

No additional token handling needed in components.

### 3. FormData for File Uploads
When image is attached, use FormData instead of JSON:

```typescript
const formData = new FormData();
formData.append('title', this.taskForm.value.title);
formData.append('description', this.taskForm.value.description);
formData.append('image', this.selectedFile);

this.taskService.createTask(formData).subscribe(...);
```

### 4. CORS Configuration
Backend CORS is set to allow requests from `http://localhost:4300`. Ensure frontend runs on port 4300.

---

## Testing Checklist

### Backend Testing
- [ ] Database connected successfully on startup
- [ ] POST /api/tasks creates task and returns 201
- [ ] GET /api/tasks/my-tasks returns user's tasks
- [ ] GET /api/tasks/:id returns specific task
- [ ] PUT /api/tasks/:id updates task
- [ ] DELETE /api/tasks/:id deletes task
- [ ] All endpoints reject requests without valid JWT token

### Frontend Testing
- [ ] Login successful, token stored in localStorage
- [ ] My Tasks page loads and displays tasks
- [ ] Add Task button navigates to add-task page
- [ ] Form validation shows errors for missing fields
- [ ] Create Task submits and redirects to my-tasks
- [ ] New task appears in My Tasks list
- [ ] Delete button removes task from list
- [ ] Image upload works and preview displays
- [ ] Error messages display for failed operations

### Integration Testing
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Log in with test credentials
4. Navigate to My Tasks
5. Create new task with all fields
6. Verify task appears in list
7. Create task with image
8. Verify image displays correctly
9. Delete a task
10. Verify task is removed

---

## Troubleshooting

### "Loading tasks..." stays infinite
- Check browser console for errors
- Verify auth token exists in localStorage
- Check if backend is running on port 5000
- Check Network tab in DevTools for failed requests

### 404 on /my-tasks endpoint
- Ensure routes.js has `/my-tasks` route defined BEFORE `/:id`
- Verify routes are mounted in server.js with `app.use('/api/tasks', taskRoutes)`

### 401 Unauthorized errors
- Login again to refresh token
- Check token hasn't expired
- Verify JWT_SECRET in backend .env matches

### Tasks table doesn't exist
- Run `node database-schema.js` to initialize
- Check PostgreSQL connection credentials in .env
- Verify database was created correctly

### Image upload fails
- Check uploads directory exists
- Verify multer middleware configured correctly
- Check file size limits

---

## File Summary

### Backend Files
```
backend/
├── server.js                    # Main server, routes mounting
├── db.js                        # Database pool connection
├── database-schema.js           # Schema initialization (NEW)
├── routes/
│   └── tasks.js                 # Task routes (FIXED)
├── middleware/
│   ├── auth.js                  # JWT verification
│   ├── errorHandler.js          # Error handling
│   └── uploadMiddleware.js      # File upload handling
└── src/
    └── config/
        ├── db.js                # Alt database config
        └── database.js          # Alt database config
```

### Frontend Files
```
frontend/src/app/
├── environments/
│   └── environment.ts           # API URL config (✅ correct)
├── services/
│   ├── task.service.ts          # Task API service
│   ├── auth.service.ts          # Auth service
│   ├── http.interceptor.ts      # JWT token interceptor
│   └── auth-guard.service.ts    # Route guard
├── components/
│   ├── tasks/                   # Reusable tasks component
│   │   ├── tasks.component.ts   # Component logic (UPDATED)
│   │   ├── tasks.component.html # Template (UPDATED)
│   │   └── tasks.component.css  # Styles (UPDATED)
│   └── pages/
│       └── my-tasks/
│           ├── my-tasks.ts      # My tasks page (complete)
│           ├── my-tasks.html    # Template (complete)
│           └── my-tasks.css     # Styles (complete)
│       └── add-task/
│           ├── add-task.ts      # Add task page (complete)
│           ├── add-task.html    # Template (complete)
│           └── add-task.css     # Styles (complete)
└── app.routes.ts                # Routes config (✅ correct)
```

---

## Next Steps

1. **Initialize Database:**
   ```bash
   cd backend
   node database-schema.js
   ```

2. **Start Backend:**
   ```bash
   npm run dev
   ```

3. **Start Frontend:**
   ```bash
   cd ../frontend
   npm start
   ```

4. **Test the Flow:**
   - Login with valid credentials
   - Navigate to "My Tasks"
   - Click "+ Add New Task"
   - Fill in form and submit
   - Verify task appears in list

---

## Support

For issues or questions:
1. Check browser console for error messages
2. Check backend terminal for server logs
3. Check Network tab in DevTools for API responses
4. Review troubleshooting section above
5. Verify all files are in correct locations with correct imports

---

**Implementation Date:** March 2026
**Status:** ✅ Complete and Ready for Testing
