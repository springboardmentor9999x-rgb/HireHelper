# HireHelper Tasks Feature - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Angular)                         │
│                   (localhost:4300)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            MyTasksComponent                              │  │
│  │  - Displays user's tasks in card grid                    │  │
│  │  - Load, Delete, Navigate functionality                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │            AddTaskComponent                              │  │
│  │  - Form for creating tasks                               │  │
│  │  - Image upload support                                  │  │
│  │  - Form validation                                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │            TasksComponent (Reusable)                     │  │
│  │  - Generic task display and management                   │  │
│  │  - Can be embedded anywhere                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │        ┌──────────────────────────────────┐              │  │
│  │        │    TaskService                   │              │  │
│  │        │  - createTask()                  │              │  │
│  │        │  - getMyTasks()                  │              │  │
│  │        │  - getTaskById()                 │              │  │
│  │        │  - updateTask()                  │              │  │
│  │        │  - deleteTask()                  │              │  │
│  │        └──────────────┬───────────────────┘              │  │
│  │                       │                                  │  │
│  │        ┌──────────────▼───────────────────┐              │  │
│  │        │  HttpTokenInterceptor            │              │  │
│  │        │  - Adds JWT Bearer token         │              │  │
│  │        │  - Handles auth errors           │              │  │
│  │        └──────────────┬───────────────────┘              │  │
│  └───────────────────────┼──────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                 HTTP(S) with Authorization Header
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                          ▼                                      │
│          BACKEND (Node.js + Express)                           │
│          (localhost:5000)                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ POST /api/tasks         - Create task (with image)      │   │
│  │ GET  /api/tasks/my-tasks - Get user's tasks (SPECIFIC) │   │
│  │ GET  /api/tasks           - Get all user's tasks       │   │
│  │ GET  /api/tasks/:id       - Get specific task          │   │
│  │ PUT  /api/tasks/:id       - Update task                │   │
│  │ DELETE /api/tasks/:id     - Delete task                │   │
│  └────────────────┬──────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼──────────────────────────────────────┐   │
│  │ AuthMiddleware (authenticateToken)                     │   │
│  │ - Validates JWT token                                  │   │
│  │ - Attaches user info to request                        │   │
│  └────────────────┬──────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼──────────────────────────────────────┐   │
│  │ Route Handlers                                         │   │
│  │ - Validate input data                                  │   │
│  │ - Ensure user_id ownership                             │   │
│  │ - Handle file uploads                                  │   │
│  └────────────────┬──────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼──────────────────────────────────────┐   │
│  │ Pool Connection (pg)                                   │   │
│  │ - Manages database connections                         │   │
│  └────────────────┬──────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┼────────────────────────────────────────────┘
                    │
         Database Query/Response
                    │
┌───────────────────▼────────────────────────────────────────────┐
│         PostgreSQL Database                                    │
├───────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TABLE: tasks                                             │  │
│  │ ┌──────────────────────────────────────────────────────┐ │  │
│  │ │ id               SERIAL PRIMARY KEY                  │ │  │
│  │ │ user_id          INTEGER (FK to users)               │ │  │
│  │ │ title            VARCHAR(255)                        │ │  │
│  │ │ description      TEXT                                │ │  │
│  │ │ location         VARCHAR(255, optional)              │ │  │
│  │ │ start_time       TIMESTAMP (optional)                │ │  │
│  │ │ end_time         TIMESTAMP (optional)                │ │  │
│  │ │ status           VARCHAR(50) DEFAULT 'OPEN'          │ │  │
│  │ │ priority         VARCHAR(50) DEFAULT 'medium'        │ │  │
│  │ │ due_date         TIMESTAMP (optional)                │ │  │
│  │ │ image/picture    VARCHAR(255) (optional)             │ │  │
│  │ │ created_at       TIMESTAMP DEFAULT CURRENT          │ │  │
│  │ │ updated_at       TIMESTAMP DEFAULT CURRENT          │ │  │
│  │ └──────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │ INDEXES:                                                │  │
│  │ - idx_tasks_user_id (for filtering by user)            │  │
│  │ - idx_tasks_created_at (for sorting)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow

### 1. Creating a Task

```
User enters task details in AddTaskComponent
              │
              ▼
Form validation (title required, desc min 10 chars)
              │
              ├─ ❌ Invalid → Show error message
              │
              └─ ✅ Valid
                      │
                      ▼
              Create FormData with:
              - title
              - description
              - location
              - start_time
              - end_time
              - image file (optional)
              │
              ▼
        TaskService.createTask(formData)
              │
              ▼
        HttpTokenInterceptor adds header:
        Authorization: Bearer <JWT_TOKEN>
              │
              ▼
        HTTP POST /api/tasks
              │
              ▼
        Backend: authenticateToken middleware
              │
              ├─ ❌ No/invalid token → 401 Unauthorized
              │
              └─ ✅ Valid token
                      │
                      ▼
              Route handler checks:
              - userId from JWT payload
              - title and description not empty
              │
              ├─ ❌ Validation fails → 400 Bad Request
              │
              └─ ✅ All valid
                      │
                      ▼
              Process file if present (multer)
              │
              ▼
              INSERT INTO tasks (user_id, title, description, ...)
              VALUES (userId, title, description, ...)
              RETURNING *
              │
              ▼
              Return 201 Created + task object
              │
              ▼
        Angular receives response
              │
              ├─ ❌ Error → Display error message
              │
              └─ ✅ Success
                      │
                      ▼
              Show success message
              │
              ▼
              Router.navigate(['/dashboard/my-tasks'])
              │
              ▼
        MyTasksComponent.loadTasks() called
              │
              ▼
        New task appears in list
```

---

### 2. Loading Tasks (My Tasks Page)

```
User navigates to /dashboard/my-tasks
              │
              ▼
        MyTasksComponent.ngOnInit()
              │
              ▼
        Check localStorage for authToken
              │
              ├─ ❌ No token → Redirect to login
              │
              └─ ✅ Token exists
                      │
                      ▼
              Set loading = true
              │
              ▼
              TaskService.getMyTasks()
              │
              ▼
              HttpTokenInterceptor adds:
              Authorization: Bearer <JWT_TOKEN>
              │
              ▼
              HTTP GET /api/tasks/my-tasks
              │
              ▼
        ⭐ CRITICAL POINT:
        Route must be checked BEFORE /:id route
        Otherwise "my-tasks" treated as ID parameter
              │
              ▼
              Backend: authenticateToken middleware
              │
              ├─ ❌ Invalid token → 401 Unauthorized
              │
              └─ ✅ Valid token
                      │
                      ▼
              Extract userId from JWT
              │
              ▼
              SELECT * FROM tasks 
              WHERE user_id = $1 
              ORDER BY created_at DESC
              │
              ▼
              Return JSON array of tasks
              │
              ▼
        Angular receives response
              │
              ├─ ❌ Error → Display error message
              │
              └─ ✅ Success
                      │
                      ▼
              Set tasks = response.data
              Set loading = false
              │
              ▼
              Template renders task cards in grid
              │
              ▼
        User sees all their tasks!
```

---

### 3. Deleting a Task

```
User clicks Delete button on task card
              │
              ▼
        Confirmation dialog:
        "Are you sure you want to delete this task?"
              │
              ├─ ❌ Cancel → Do nothing
              │
              └─ ✅ Confirm
                      │
                      ▼
              Set loading = true
              │
              ▼
              TaskService.deleteTask(taskId)
              │
              ▼
              HttpTokenInterceptor adds:
              Authorization: Bearer <JWT_TOKEN>
              │
              ▼
              HTTP DELETE /api/tasks/:id
              │
              ▼
              Backend: authenticateToken middleware
              │
              ├─ ❌ Invalid token → 401 Unauthorized
              │
              └─ ✅ Valid token
                      │
                      ▼
              DELETE FROM tasks 
              WHERE id = $1 AND user_id = $2
              │
              ├─ ❌ Not found or wrong user → 404
              │
              └─ ✅ Deleted
                      │
                      ▼
              Return 200 { message: 'task deleted' }
              │
              ▼
        Angular receives response
              │
              ├─ ❌ Error → Display error message
              │
              └─ ✅ Success
                      │
                      ▼
              Show "Task deleted successfully!"
              │
              ▼
              Filter task from local tasks array
              │
              ▼
              UI updates automatically
              │
              ▼
        Task is gone from the list
```

---

## Error Handling Flow

```
HTTP Request occurs
        │
        ▼
   Response received
        │
        ├─ 2xx (Success)
        │   └─ Process data, update UI
        │
        ├─ 4xx (Client Error)
        │   ├─ 400: Bad Request → Validation error
        │   ├─ 401: Unauthorized → Token invalid/expired
        │   ├─ 404: Not Found → Resource doesn't exist
        │   └─ Display error message to user
        │
        ├─ 5xx (Server Error)
        │   └─ 500: Internal Server Error
        │       └─ Display generic error message
        │
        └─ Network Error
            └─ Connection failed
                └─ Display "Connection error. Backend server may not be running."
```

---

## Key Technical Details

### Route Priority (CRITICAL)

Express.js matches routes in the order they are defined. The order MUST be:

```javascript
// ✅ CORRECT ORDER
router.post('/', ...);              // 1. Create (POST /)
router.get('/my-tasks', ...);       // 2. Specific route FIRST
router.get('/', ...);               // 3. General GET
router.get('/:id', ...);            // 4. Generic route LAST!
router.put('/:id', ...);            // 5. Update
router.delete('/:id', ...);         // 6. Delete
```

**Why?** Once `/my-tasks` is matched, the router doesn't check `/:id`. If `/:id` came first, "my-tasks" would be caught as an ID parameter.

### JWT Token Flow

```
POST /login
    │
    ▼
Backend validates credentials
    │
    ├─ Invalid → 401
    │
    └─ Valid
        │
        ▼
    Create JWT token with userId
    │
    ▼
Send token to frontend
    │
    ▼
Frontend stores in localStorage
│
on every subsequent request
│
▼
HttpInterceptor reads from localStorage
│
▼
Adds to Authorization header:
"Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
│
▼
Backend authenticateToken middleware:
│
├─ No header → 401
│
├─ Invalid format → 401
│
├─ Expired token → 401
│
└─ Valid
    │
    ▼
    Verify JWT signature
    │
    ├─ Invalid → 401
    │
    └─ Valid
        │
        ▼
        Decode token, extract userId
        │
        ▼
        Attach to req.user
        │
        ▼
        Proceed to route handler
```

---

## Performance Considerations

1. **Database Indexes:**
   - `idx_tasks_user_id` - Speeds up filtering by user_id
   - `idx_tasks_created_at` - Speeds up sorting by creation date

2. **Query Optimization:**
   - Always filter by user_id first
   - Order by created_at DESC for latest first
   - Return only necessary columns

3. **Frontend Caching:**
   - Load tasks once on page init
   - Subsequent operations load full list to reflect changes
   - Could implement pagination for large lists

4. **File Upload:**
   - Image files saved to `backend/uploads/`
   - Consider file size limits in production
   - Implement image compression for optimization

---

## Security Considerations

1. ✅ JWT authentication on all routes
2. ✅ User_id validation (can't access others' tasks)
3. ✅ CORS restricted to localhost:4300
4. ✅ File upload validation via multer
5. ⚠️ TODO: Add rate limiting for file uploads
6. ⚠️ TODO: Validate file types (whitelist jpg, png, gif)
7. ⚠️ TODO: Add file size limits

---

## Deployment Considerations

When moving to production:

1. Deploy backend to production server
2. Update frontend environment.apiUrl to production API URL
3. Configure CORS for production domain
4. Enable HTTPS
5. Update JWT_SECRET to strong random value
6. Set NODE_ENV=production
7. Enable database backups
8. Implement request logging and monitoring
9. Add rate limiting middleware
10. Consider CDN for serving images

---

**Last Updated:** March 2026
**Status:** ✅ Complete Implementation with Full Documentation
