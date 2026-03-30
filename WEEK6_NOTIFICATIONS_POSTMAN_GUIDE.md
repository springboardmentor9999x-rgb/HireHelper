# WEEK 6 — REQUEST STATUS HANDLING & NOTIFICATIONS

## COMPREHENSIVE POSTMAN GUIDE

---

## **BASE URL**
```
http://localhost:5000/api
```

---

## **OVERVIEW**

Week 6 adds complete notification system integration:

### **New Features:**
- ✅ Notifications table created
- ✅ Notifications sent when request created
- ✅ Notifications sent when request accepted/rejected
- ✅ Task status updates to ASSIGNED when request accepted
- ✅ Get, read, and delete notifications
- ✅ Angular notifications dashboard

---

## **PART 1 — NOTIFICATION ENDPOINTS**

### **ENDPOINT 1️⃣: GET ALL NOTIFICATIONS**
**GET** `/api/notifications`

| Field | Value |
|-------|-------|
| **Method** | GET |
| **URL** | `http://localhost:5000/api/notifications` |
| **Auth** | Bearer Token (your JWT) |
| **Body** | (empty) |

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Loaded 5 notification(s)",
  "data": [
    {
      "id": "uuid-1",
      "user_id": "your-user-id",
      "body": "Someone requested to help with your task \"Build Website\".",
      "is_read": false,
      "created_at": "2026-03-26T14:30:00"
    },
    {
      "id": "uuid-2",
      "user_id": "your-user-id",
      "body": "Your request has been accepted! The task owner will contact you soon.",
      "is_read": true,
      "created_at": "2026-03-26T14:45:00"
    }
  ],
  "count": 5
}
```

---

### **ENDPOINT 2️⃣: MARK NOTIFICATION AS READ**
**PUT** `/api/notifications/:id/read`

| Field | Value |
|-------|-------|
| **Method** | PUT |
| **URL** | `http://localhost:5000/api/notifications/UUID-HERE/read` |
| **Auth** | Bearer Token |
| **Body** | (empty) |

**Example URL:**
```
http://localhost:5000/api/notifications/550e8400-e29b-41d4-a716-446655440001/read
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "your-user-id",
    "body": "Someone requested to help with your task",
    "is_read": true,
    "created_at": "2026-03-26T14:30:00"
  }
}
```

---

### **ENDPOINT 3️⃣: DELETE NOTIFICATION**
**DELETE** `/api/notifications/:id`

| Field | Value |
|-------|-------|
| **Method** | DELETE |
| **URL** | `http://localhost:5000/api/notifications/UUID-HERE` |
| **Auth** | Bearer Token |
| **Body** | (empty) |

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## **PART 2 — UPDATED REQUEST ENDPOINTS**

### **ENDPOINT 4️⃣: SEND REQUEST (Updated with Notification)**
**POST** `/api/requests`

| Field | Value |
|-------|-------|
| **Method** | POST |
| **URL** | `http://localhost:5000/api/requests` |
| **Auth** | Bearer Token |
| **Body (JSON)** | `{ "task_id": "UUID-HERE" }` |

**What Happens:**
1. ✅ Request created with status PENDING
2. ✅ Task owner receives notification: "Someone requested to help with your task..."
3. ✅ Requester can view it in "My Requests"

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Request sent successfully",
  "data": {
    "id": "request-uuid",
    "task_id": "task-uuid",
    "requester_id": "your-id",
    "status": "PENDING",
    "created_at": "2026-03-26T15:00:00"
  }
}
```

---

### **ENDPOINT 5️⃣: ACCEPT REQUEST (Updated with Notification & Task Status)**
**PUT** `/api/requests/:id/accept`

| Field | Value |
|-------|-------|
| **Method** | PUT |
| **URL** | `http://localhost:5000/api/requests/REQUEST-ID-HERE/accept` |
| **Auth** | Bearer Token (TASK OWNER) |
| **Body** | (empty) |

**What Happens:**
1. ✅ Request status → ACCEPTED
2. ✅ Task status → ASSIGNED
3. ✅ Requester receives notification: "Your request has been accepted!..."
4. ✅ Task owner can see it in "Requests (Received)" as ACCEPTED

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "data": {
    "id": "request-uuid",
    "status": "ACCEPTED",
    "updated_at": "2026-03-26T15:15:00"
  }
}
```

---

### **ENDPOINT 6️⃣: REJECT REQUEST (Updated with Notification)**
**PUT** `/api/requests/:id/reject`

| Field | Value |
|-------|-------|
| **Method** | PUT |
| **URL** | `http://localhost:5000/api/requests/REQUEST-ID-HERE/reject` |
| **Auth** | Bearer Token (TASK OWNER) |
| **Body** | (empty) |

**What Happens:**
1. ✅ Request status → REJECTED
2. ✅ Requester receives notification: "Your request was not accepted at this time..."
3. ✅ Task remains OPEN for other requests

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Request rejected successfully",
  "data": {
    "id": "request-uuid",
    "status": "REJECTED",
    "updated_at": "2026-03-26T15:20:00"
  }
}
```

---

## **PART 3 — COMPLETE WORKFLOW EXAMPLE**

### **Test Scenario: 2 Users**

**User A** = Task Owner (creates task & accepts requests)
**User B** = Requester (sends request for User A's task)

---

### **Step 1: Login as User A (Task Owner)**
```
POST http://localhost:5000/api/auth/login

Body:
{
  "email": "userA@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJh..."  ← Save this as TOKEN_A
}
```

---

### **Step 2: Login as User B (Requester)**
```
POST http://localhost:5000/api/auth/login

Body:
{
  "email": "userB@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJh..."  ← Save this as TOKEN_B
}
```

---

### **Step 3: Get Task ID from User A (Created by User A)**
```
GET http://localhost:5000/api/tasks/my-tasks

Auth: Bearer TOKEN_A

Response shows User A's tasks, find one with status "open"
Copy the task id → TASK_ID
```

---

### **Step 4: User B Sends Request (using TOKEN_B)**
```
POST http://localhost:5000/api/requests

Auth: Bearer TOKEN_B

Body:
{
  "task_id": "TASK_ID"
}

Response:
{
  "success": true,
  "message": "Request sent successfully",
  "data": {
    "id": "request-id"  ← Save as REQUEST_ID
  }
}

✅ RESULT: User A receives notification: "Someone requested to help with your task..."
```

---

### **Step 5: User A Checks Received Requests**
```
GET http://localhost:5000/api/requests/received

Auth: Bearer TOKEN_A

Response shows request from User B with status "PENDING"
```

---

### **Step 6: User A Checks Notifications**
```
GET http://localhost:5000/api/notifications

Auth: Bearer TOKEN_A

Response shows:
[
  {
    "body": "Someone requested to help with your task \"Build Website\".",
    "is_read": false
  }
]
```

---

### **Step 7: User A Accepts Request**
```
PUT http://localhost:5000/api/requests/REQUEST_ID/accept

Auth: Bearer TOKEN_A

Body: (empty)

Response:
{
  "success": true,
  "status": "ACCEPTED"
}

✅ RESULT:
  - Request status → ACCEPTED
  - Task status → ASSIGNED
  - User B receives notification: "Your request has been accepted!..."
```

---

### **Step 8: User B Checks Notifications**
```
GET http://localhost:5000/api/notifications

Auth: Bearer TOKEN_B

Response shows:
[
  {
    "body": "Your request has been accepted! The task owner will contact you soon.",
    "is_read": false
  }
]
```

---

### **Step 9: User B Marks Notification as Read**
```
PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read

Auth: Bearer TOKEN_B

Body: (empty)

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### **Step 10: User B Deletes Notification**
```
DELETE http://localhost:5000/api/notifications/NOTIFICATION_ID

Auth: Bearer TOKEN_B

Body: (empty)

Response:
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## **PART 4 — NOTIFICATION MESSAGES**

| Trigger | Message | Sent To |
|---------|---------|---------|
| Request Created | "Someone requested to help with your task \"[TITLE]\"." | Task Owner |
| Request Accepted | "Your request has been accepted! The task owner will contact you soon." | Requester |
| Request Rejected | "Your request was not accepted at this time. You can try other tasks." | Requester |

---

## **PART 5 — ERROR RESPONSES**

### **Error: Cannot Mark Own Notification as Read**
```json
{
  "success": false,
  "message": "You do not have permission to update this notification"
}
```

### **Error: Notification Not Found**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

### **Error: Unauthorized**
```json
{
  "success": false,
  "message": "Your session has expired. Please login again."
}
```

---

## **PART 6 — POSTMAN SETUP**

1. **Create Variables:**
   - `token_a` = User A's JWT token
   - `token_b` = User B's JWT token
   - `task_id` = UUID of task
   - `request_id` = UUID of request
   - `notification_id` = UUID of notification

2. **Create Collection with Folders:**
   - Notifications (GET, PUT, DELETE)
   - Requests (GET, POST, PUT)
   - Workflow (complete testing sequence)

3. **Set Authorization Header for All:**
   - Key: `Authorization`
   - Value: `Bearer {{token}}`

4. **Add to Body for POST:**
   - Content-Type: `application/json`

---

## **PART 7 — DATABASE STATUS CHANGES**

### **Tasks Table Update**
When request is ACCEPTED:
```sql
UPDATE tasks SET status = 'ASSIGNED' WHERE id = $1;
```

| Status Before | Status After | Trigger |
|---|---|---|
| open | ASSIGNED | Request accepted |

---

## **PART 8 — DATA FLOW DIAGRAM**

```
User B Sends Request
    ↓
Request Created (PENDING)
    ↓
Notification → User A: "Someone requested..."
    ↓
User A Sees Received Requests
    ↓
User A Clicks "Accept"
    ↓
Request → ACCEPTED
Task → ASSIGNED
    ↓
Notification → User B: "Your request accepted..."
    ↓
User B Sees Notifications
    ↓
Success!
```

---

## **READY TO TEST?**

Follow **Part 3 — Complete Workflow Example** to test the full integration end-to-end! 🚀

**Key Points:**
- ✅ Always use correct user's JWT token
- ✅ Task owner only can accept/reject
- ✅ Requester only can see own requests
- ✅ Notifications auto-create on status change
- ✅ Task status auto-updates to ASSIGNED
