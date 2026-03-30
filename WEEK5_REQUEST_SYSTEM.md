# Week 5 - Request System Implementation

## ✅ COMPLETED IMPLEMENTATION

### 1. DATABASE SETUP ✓
**File:** `database-migration-requests.js`
- Created `requests` table with fields:
  - `id` (UUID, PRIMARY KEY)
  - `task_id` (UUID, FOREIGN KEY → tasks)
  - `requester_id` (UUID, FOREIGN KEY → users)
  - `status` (VARCHAR, default: 'PENDING')
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
- Includes indexes on `task_id`, `requester_id`, and `status`

**Run migration:**
```bash
node database-migration-requests.js
```

---

### 2. BACKEND APIs ✓

**File:** `src/controllers/requestController.js`

#### Endpoints:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/requests` | Send a request for a task |
| GET | `/api/requests/my` | Get my sent requests |
| GET | `/api/requests/received` | Get received requests for my tasks |
| GET | `/api/requests/:id` | Get request details |
| PUT | `/api/requests/:id/accept` | Accept a request |
| PUT | `/api/requests/:id/reject` | Reject a request |
| DELETE | `/api/requests/:id` | Cancel a sent request |

#### Validations:
- ✓ JWT authentication required
- ✓ Cannot request own task
- ✓ Cannot request same task twice
- ✓ Task must exist and be OPEN
- ✓ Only task owner can accept/reject
- ✓ Only requester can cancel

---

### 3. ANGULAR SERVICE ✓

**File:** `src/app/services/request.service.ts`

Methods:
```typescript
sendRequest(taskId: string)         // POST /api/requests
getMyRequests()                      // GET /api/requests/my
getReceivedRequests()                // GET /api/requests/received
getRequestById(id: string)           // GET /api/requests/:id
acceptRequest(id: string)            // PUT /api/requests/:id/accept
rejectRequest(id: string)            // PUT /api/requests/:id/reject
cancelRequest(id: string)            // DELETE /api/requests/:id
```

---

### 4. FRONTEND COMPONENTS ✓

#### A. Feed Component (Updated)
**File:** `src/app/components/pages/feed/feed.ts`
- Added request button to each task card
- Button shows loading state while sending
- Displays success/error messages
- Tracks multiple requests with Set

#### B. My Requests Component (NEW)
**Files:**
- `src/app/components/pages/my-requests/my-requests.ts`
- `src/app/components/pages/my-requests/my-requests.html`
- `src/app/components/pages/my-requests/my-requests.css`

Features:
- Lists all user's sent requests
- Shows task title, location, owner name
- Status badge (PENDING/ACCEPTED/REJECTED)
- Cancel button for PENDING requests
- Empty state when no requests

#### C. Received Requests Component (NEW)
**Files:**
- `src/app/components/pages/requests/requests.ts`
- `src/app/components/pages/requests/requests.html`
- `src/app/components/pages/requests/requests.css`

Features:
- Lists all requests for user's tasks
- Shows requester name and email
- Status badge
- Accept/Reject buttons for PENDING requests
- Empty state when no requests

---

## 📋 POSTMAN TESTING

### 1. Send Request
```
POST http://localhost:5000/api/requests
Headers:
  Authorization: Bearer <TOKEN>
Body:
{
  "task_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}

Expected: 201 Created
```

### 2. Get My Requests
```
GET http://localhost:5000/api/requests/my
Headers:
  Authorization: Bearer <TOKEN>

Expected: 200 OK
```

### 3. Get Received Requests
```
GET http://localhost:5000/api/requests/received
Headers:
  Authorization: Bearer <TOKEN>

Expected: 200 OK
```

### 4. Accept Request
```
PUT http://localhost:5000/api/requests/{requestId}/accept
Headers:
  Authorization: Bearer <TOKEN>

Expected: 200 OK
```

### 5. Reject Request
```
PUT http://localhost:5000/api/requests/{requestId}/reject
Headers:
  Authorization: Bearer <TOKEN>

Expected: 200 OK
```

### 6. Cancel Request
```
DELETE http://localhost:5000/api/requests/{requestId}
Headers:
  Authorization: Bearer <TOKEN>

Expected: 200 OK
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Send Request
1. Login as User A
2. Navigate to Feed
3. Click "Request" on a task from User B
4. Should see "Request sent successfully" message
5. Go to "My Requests" - request should appear with PENDING status

### Scenario 2: Receive & Accept Request
1. Login as User B (task owner)
2. Go to "Received Requests"
3. See request from User A
4. Click "Accept" button
5. Status should change to ACCEPTED

### Scenario 3: Cannot Duplicate Request
1. User A tries to request the same task again
2. Should get error: "You already requested this task"

### Scenario 4: Cannot Request Own Task
1. User creates a task
2. Tries to request own task
3. Should get error: "You cannot request your own task"

### Scenario 5: Cannot Request Closed Task
1. Task status changes from 'open' to 'closed'
2. Try to send request
3. Should get error: "Task is not available for requests"

---

## 🔄 USER FLOWS

### User A (Requester)
1. **Feed Page** → Browse tasks from other users
2. **Send Request** → Click "Request" button on task
3. **My Requests** → Track all sent requests
4. **Cancel Request** → Cancel PENDING requests if needed

### User B (Task Owner)
1. **Create Task** → Task appears in feed for others
2. **Received Requests** → See who's interested
3. **Accept/Reject** → Manage incoming requests
4. **My Tasks** → Shows created tasks

---

## 📁 FILE STRUCTURE

```
backend/
  database-migration-requests.js
  src/
    controllers/
      requestController.js
    routes/
      requestRoutes.js
  app.js (updated with request routes)

frontend/
  src/app/
    services/
      request.service.ts
    components/pages/
      feed/
        feed.ts (updated)
        feed.html (updated)
      my-requests/
        my-requests.ts (new)
        my-requests.html (new)
        my-requests.css (new)
        index.ts (new)
      requests/
        requests.ts (new)
        requests.html (new)
        requests.css (new)
        index.ts (new)
    app.routes.ts (already updated)
```

---

## ✨ FEATURES

✅ Send requests for tasks
✅ View sent requests
✅ View received requests  
✅ Accept/Reject requests
✅ Cancel requests
✅ Prevent duplicate requests
✅ Prevent self-requests
✅ Prevent closed task requests
✅ Status tracking (PENDING/ACCEPTED/REJECTED)
✅ Full error handling
✅ JWT authentication
✅ Responsive design
✅ Loading states
✅ Empty states
✅ Success/Error messages

---

## 🚀 READY TO USE

All files are created and integrated. The system is complete and ready for testing!

Start the frontend and backend, then test the request flows.
