# WEEK 6 – REQUEST STATUS HANDLING & NOTIFICATIONS 
## IMPLEMENTATION COMPLETE ✅

---

## **OVERVIEW**

Week 6 adds a complete notification system that:
- Creates notifications when requests are sent
- Creates notifications when requests are accepted/rejected
- Updates task status to ASSIGNED when request accepted
- Provides API to fetch, read, and delete notifications
- Includes a full frontend dashboard for viewing notifications

---

## **WHAT WAS IMPLEMENTED**

### **1. DATABASE**
✅ **Notifications Table Created**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Run Migration:**
```bash
cd backend
node database-migration-notifications.js
```

---

### **2. BACKEND - REQUEST CONTROLLER UPDATES**

#### **A. Send Request - POST /api/requests**
- Creates notification for task owner
- Message: `"Someone requested to help with your task \"[TITLE]\"."`

#### **B. Accept Request - PUT /api/requests/:id/accept**
- Updates request status to ACCEPTED
- **NEW:** Updates task status to ASSIGNED
- **NEW:** Creates notification for requester
- Message: `"Your request has been accepted! The task owner will contact you soon."`

#### **C. Reject Request - PUT /api/requests/:id/reject**
- Updates request status to REJECTED
- **NEW:** Creates notification for requester
- Message: `"Your request was not accepted at this time. You can try other tasks."`

---

### **3. BACKEND - NOTIFICATION CONTROLLER**

**Location:** `backend/src/controllers/notificationController.js`

#### **Methods:**
- `getNotifications()` - GET /api/notifications
- `markAsRead(notificationId)` - PUT /api/notifications/:id/read
- `deleteNotification(notificationId)` - DELETE /api/notifications/:id
- `createNotification(userId, body)` - Internal helper function

**Features:**
- ✅ Get all notifications for user
- ✅ Mark notification as read
- ✅ Delete notification permanently
- ✅ Auto-created by request system
- ✅ Full permission & ownership checks

---

### **4. BACKEND - NOTIFICATION ROUTES**

**Location:** `backend/src/routes/notificationRoutes.js`

**Routes:**
```
GET    /api/notifications              - Get all notifications
PUT    /api/notifications/:id/read     - Mark as read
DELETE /api/notifications/:id          - Delete notification
```

**All routes are JWT protected**

---

### **5. FRONTEND - NOTIFICATION SERVICE**

**Location:** `frontend/src/app/services/notification.service.ts`

**Methods:**
```typescript
getNotifications()
markAsRead(notificationId: string)
deleteNotification(notificationId: string)
```

**Interfaces:**
```typescript
interface Notification {
  id: string;
  user_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
```

---

### **6. FRONTEND - NOTIFICATIONS COMPONENT**

**Location:** `frontend/src/app/components/pages/notifications/`

**Files:**
- `notifications.ts` - Component logic
- `notifications.html` - Template
- `notifications.css` - Styling

**Features:**
- ✅ Display all notifications
- ✅ Show unread count badge
- ✅ Mark notification as read
- ✅ Delete notification
- ✅ Relative time display (e.g., "5 minutes ago")
- ✅ Empty state
- ✅ Loading spinner
- ✅ Error handling
- ✅ Responsive design

**Route:** `/dashboard/notifications`

---

### **7. NOTIFICATION MESSAGES**

| Event | Message | Sent To |
|-------|---------|---------|
| Request Created | "Someone requested to help with your task \"[TITLE]\"." | Task Owner |
| Request Accepted | "Your request has been accepted! The task owner will contact you soon." | Requester |
| Request Rejected | "Your request was not accepted at this time. You can try other tasks." | Requester |

---

## **DATABASE CHANGES**

### **New Table: notifications**
```
Columns:
- id (UUID, PK)
- user_id (UUID, FK → users)
- body (TEXT)
- is_read (BOOLEAN, default false)
- created_at (TIMESTAMP)

Indexes:
- idx_notifications_user_id
- idx_notifications_is_read
- idx_notifications_created_at
```

### **Modified Tables**
- **tasks:** No new columns, but status can now be "ASSIGNED"
- **requests:** No changes (reuses existing table)

---

## **STATUS VALUES**

### **Task Status**
- `open` - Available for requests
- `ASSIGNED` - Request accepted (NEW!)
- `completed` - Task finished

### **Request Status**
- `PENDING` - Request sent, awaiting response
- `ACCEPTED` - Request accepted
- `REJECTED` - Request rejected

### **Notification States**
- `is_read: false` - Unread (highlighted)
- `is_read: true` - Read (normal)

---

## **API ENDPOINTS**

### **Notification APIs**
```
GET    /api/notifications              ← Get all user notifications
PUT    /api/notifications/:id/read     ← Mark as read
DELETE /api/notifications/:id          ← Delete notification
```

### **Updated Request APIs**
```
POST   /api/requests                   ← Creates notification for task owner
PUT    /api/requests/:id/accept        ← Updates task status, creates notification
PUT    /api/requests/:id/reject        ← Creates notification for requester
GET    /api/requests/my
GET    /api/requests/received
GET    /api/requests/:id
DELETE /api/requests/:id
```

---

## **WORKFLOW EXAMPLE**

### **Full Request → Accept Flow**

```
1. User B sends request for User A's task
   ↓
2. Request created with status PENDING
   ↓
3. Notification created for User A:
   "Someone requested to help with your task 'Build Website'."
   ↓
4. User A sees notification in /dashboard/notifications
   ↓
5. User A goes to "Requests" and clicks "Accept"
   ↓
6. Request status → ACCEPTED
7. Task status → ASSIGNED
8. Notification created for User B:
   "Your request has been accepted!..."
   ↓
9. User B sees notification in /dashboard/notifications
   ↓
10. User B clicks "Mark Read"
    ↓
11. Notification marked as read (is_read: true)
    ↓
12. Complete! ✅
```

---

## **TESTING IN POSTMAN**

### **Complete Test Sequence**

**Step 1:** Login as User A (Task Owner)
```
POST /api/auth/login
```

**Step 2:** Login as User B (Requester)
```
POST /api/auth/login
```

**Step 3:** Get User A's open task
```
GET /api/tasks/my-tasks (with User A's token)
```

**Step 4:** User B sends request
```
POST /api/requests
Body: { "task_id": "task-uuid" }
(with User B's token)
```

**Step 5:** User A checks notifications
```
GET /api/notifications (with User A's token)
```

**Step 6:** User A accepts request
```
PUT /api/requests/request-uuid/accept (with User A's token)
```

**Step 7:** User B checks notifications
```
GET /api/notifications (with User B's token)
```

**Step 8:** User B marks notification as read
```
PUT /api/notifications/notification-uuid/read (with User B's token)
```

---

## **FILE STRUCTURE**

```
backend/
├── src/
│   ├── controllers/
│   │   ├── requestController.js (UPDATED)
│   │   └── notificationController.js (EXISTS)
│   ├── routes/
│   │   ├── requestRoutes.js (EXISTS)
│   │   └── notificationRoutes.js (EXISTS)
│   └── config/
│       └── db.js (EXISTING)
├── database-migration-notifications.js (EXISTS)
├── app.js (REGISTERED ROUTES)
└── server.js

frontend/
├── src/app/
│   ├── components/pages/
│   │   ├── notifications/
│   │   │   ├── notifications.ts (CREATED)
│   │   │   ├── notifications.html (CREATED)
│   │   │   └── notifications.css (CREATED)
│   │   ├── requests/ (EXISTS)
│   │   └── my-requests/ (EXISTS)
│   ├── services/
│   │   ├── notification.service.ts (EXISTS)
│   │   └── request.service.ts (EXISTS)
│   └── app.routes.ts (UPDATED - added notifications route)
```

---

## **ERROR HANDLING**

### **Permission Errors**
```json
{
  "success": false,
  "message": "You do not have permission to update this notification"
}
```

### **Not Found**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

### **Auth Errors**
```json
{
  "success": false,
  "message": "Your session has expired. Please login again."
}
```

---

## **VALIDATIONS**

✅ **Only task owner can accept/reject requests**
✅ **Only requester can cancel their request**
✅ **Only correct user can view/modify their notifications**
✅ **Task status auto-updates to ASSIGNED on accept**
✅ **Notifications created atomically with status changes**
✅ **JWT required on all protected endpoints**

---

## **IMPORTANT: TASK STATUS UPDATE**

When request is **ACCEPTED**:
```sql
UPDATE tasks SET status = 'ASSIGNED' WHERE id = $1;
```

This tells the system:
- ❌ Task is no longer accepting new requests
- ✅ Task has been assigned to someone
- ℹ️ Task can move to "completed" when done

---

## **NEXT STEPS (FOR FUTURE WEEKS)**

- Real-time notifications (WebSocket)
- Email notifications
- Notification groups (bundle similar notifications)
- Notification preferences
- Notification history/archive
- Notification categories/filtering

---

## **TESTING CHECKLIST**

- [ ] Notifications table created
- [ ] POST /api/requests creates notification for task owner
- [ ] PUT /api/requests/:id/accept updates task to ASSIGNED
- [ ] PUT /api/requests/:id/accept creates notification for requester
- [ ] PUT /api/requests/:id/reject creates notification for requester
- [ ] GET /api/notifications returns all user notifications
- [ ] PUT /api/notifications/:id/read marks as read
- [ ] DELETE /api/notifications/:id deletes notification
- [ ] /dashboard/notifications page loads
- [ ] Notifications display with relative timestamps
- [ ] Mark as read works in UI
- [ ] Delete notification works in UI
- [ ] Unread count badge shows correctly
- [ ] Empty state displays when no notifications
- [ ] Error messages display correctly

---

## **QUICK START**

1. **Run migration:**
   ```bash
   cd backend
   node database-migration-notifications.js
   ```

2. **Backend ready** - No code changes needed, already updated

3. **Frontend ready** - Notifications component installed at `/dashboard/notifications`

4. **Test in Postman:**
   - Follow the "Complete Test Sequence" above
   - Use TOKEN_A and TOKEN_B

5. **Test in UI:**
   - Send request in Feed
   - Check Notifications page
   - Accept/Reject in Requests page
   - Verify notifications update

---

## **DOCUMENTATION**

Complete Postman guide: See `WEEK6_NOTIFICATIONS_POSTMAN_GUIDE.md` for end-to-end examples with request/response bodies.

---

## **SUMMARY**

✅ **Week 6 Complete!**

Your HireHelper app now has:
- Full notification system
- Auto-notifications on request status changes
- Task status updates to ASSIGNED when accepted
- Notifications page in frontend
- Complete API for managing notifications

**You can test this fully in Postman right now!** 🚀
