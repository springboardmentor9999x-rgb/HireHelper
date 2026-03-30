# Notification API - Postman Collection & Testing Guide

## 📌 Base URL
```
http://localhost:3000/api/notifications
```

## 🔐 Authentication

All endpoints require a **Bearer Token** in the header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

To get a valid JWT token:
1. Login at: `http://localhost:4200/login`
2. Open browser **DevTools** (F12)
3. Go to **Network** tab
4. Look for a request to `/api/auth/login`
5. In Response, copy the `token` value
6. Use it in Postman

---

## 📋 Postman Collection (JSON)

Copy and paste this into Postman (File → Import → Raw text):

```json
{
  "info": {
    "name": "HireHelper Notifications API",
    "description": "Complete notification system API endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Notifications",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/notifications",
          "host": ["{{base_url}}"],
          "path": ["notifications"]
        },
        "description": "Fetch all notifications for logged-in user (max 50, ordered by newest first)"
      },
      "response": []
    },
    {
      "name": "Get Unread Count",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/notifications/unread-count",
          "host": ["{{base_url}}"],
          "path": ["notifications", "unread-count"]
        },
        "description": "Get count of unread notifications for current user"
      },
      "response": []
    },
    {
      "name": "Mark Single Notification as Read",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{}"
        },
        "url": {
          "raw": "{{base_url}}/notifications/read/:notificationId",
          "host": ["{{base_url}}"],
          "path": ["notifications", "read", ":notificationId"]
        },
        "description": "Mark a single notification as read. Replace :notificationId with actual UUID"
      },
      "response": []
    },
    {
      "name": "Mark All Notifications as Read",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{}"
        },
        "url": {
          "raw": "{{base_url}}/notifications/read-all",
          "host": ["{{base_url}}"],
          "path": ["notifications", "read-all"]
        },
        "description": "Mark all notifications as read for current user ⭐ NEW"
      },
      "response": []
    },
    {
      "name": "Create Notification (Admin)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"USER_UUID_HERE\",\n  \"body\": \"This is a test notification message\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/notifications/create",
          "host": ["{{base_url}}"],
          "path": ["notifications", "create"]
        },
        "description": "Create a new notification for a user (admin/system use)"
      },
      "response": []
    },
    {
      "name": "Delete Notification",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/notifications/:notificationId",
          "host": ["{{base_url}}"],
          "path": ["notifications", ":notificationId"]
        },
        "description": "Delete a notification. Replace :notificationId with actual UUID"
      },
      "response": []
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN_HERE",
      "type": "string"
    },
    {
      "key": "notification_id",
      "value": "NOTIFICATION_UUID_HERE",
      "type": "string"
    },
    {
      "key": "user_id",
      "value": "USER_UUID_HERE",
      "type": "string"
    }
  ]
}
```

---

## 🔗 Individual Endpoint Details

### 1️⃣ GET All Notifications

**URL:** `GET http://localhost:3000/api/notifications`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:** (empty)

**Curl:**
```bash
curl -X GET "http://localhost:3000/api/notifications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "body": "Your task has been accepted",
      "is_read": false,
      "created_at": "2026-03-27T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "body": "New request for your task",
      "is_read": true,
      "created_at": "2026-03-27T09:15:00.000Z"
    }
  ]
}
```

---

### 2️⃣ GET Unread Count

**URL:** `GET http://localhost:3000/api/notifications/unread-count`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:** (empty)

**Curl:**
```bash
curl -X GET "http://localhost:3000/api/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3
}
```

---

### 3️⃣ PUT Mark Single as Read

**URL:** `PUT http://localhost:3000/api/notifications/read/:notificationId`

**Replace `:notificationId` with actual UUID**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{}
```

**Example URL:**
```
PUT http://localhost:3000/api/notifications/read/550e8400-e29b-41d4-a716-446655440000
```

**Curl:**
```bash
curl -X PUT "http://localhost:3000/api/notifications/read/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "body": "Your task has been accepted",
    "is_read": true,
    "created_at": "2026-03-27T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

### 4️⃣ PUT Mark All as Read ⭐ NEW

**URL:** `PUT http://localhost:3000/api/notifications/read-all`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{}
```

**Curl:**
```bash
curl -X PUT "http://localhost:3000/api/notifications/read-all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Marked 3 notifications as read",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "body": "Your task has been accepted",
      "is_read": true,
      "created_at": "2026-03-27T10:30:00.000Z"
    }
  ]
}
```

---

### 5️⃣ POST Create Notification (Admin)

**URL:** `POST http://localhost:3000/api/notifications/create`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "body": "Your task has been completed successfully"
}
```

**Curl:**
```bash
curl -X POST "http://localhost:3000/api/notifications/create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "660e8400-e29b-41d4-a716-446655440000",
    "body": "Your task has been completed successfully"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "body": "Your task has been completed successfully",
    "is_read": false,
    "created_at": "2026-03-27T11:45:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "userId and body are required"
}
```

---

### 6️⃣ DELETE Notification

**URL:** `DELETE http://localhost:3000/api/notifications/:notificationId`

**Replace `:notificationId` with actual UUID**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** (empty)

**Example URL:**
```
DELETE http://localhost:3000/api/notifications/550e8400-e29b-41d4-a716-446655440000
```

**Curl:**
```bash
curl -X DELETE "http://localhost:3000/api/notifications/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

## 📊 Postman Setup Instructions

### Step 1: Set Environment Variables
In Postman, create a new **Environment** with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000/api` | API base URL |
| `jwt_token` | `your-token-here` | Your JWT token from login |
| `notification_id` | `550e8400-...` | A notification UUID for testing |
| `user_id` | `660e8400-...` | A user UUID |

### Step 2: Use Variables in Requests
Replace hardcoded values with variables:
- `{{base_url}}` instead of `http://localhost:3000/api`
- `{{jwt_token}}` in Authorization header
- `{{notification_id}}` in URL paths
- `{{user_id}}` in request bodies

### Step 3: Save as Collection
File → Export → Select all requests → Export as JSON

---

## ✅ Quick Testing Workflow

### 1. Get Your Notifications
```
GET {{base_url}}/notifications
```
Copy a notification ID from response

### 2. Check Unread Count
```
GET {{base_url}}/notifications/unread-count
```

### 3. Mark Single as Read
```
PUT {{base_url}}/notifications/read/{{notification_id}}
```

### 4. Mark All as Read
```
PUT {{base_url}}/notifications/read-all
```

### 5. Create Test Notification
```
POST {{base_url}}/notifications/create
Body: {
  "userId": "{{user_id}}",
  "body": "Test notification"
}
```

### 6. Delete Notification
```
DELETE {{base_url}}/notifications/{{notification_id}}
```

---

## 🔴 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Invalid/Missing token | Get valid JWT from login |
| `404 Not Found` | Invalid notification ID | Check notification exists first |
| `400 Bad Request` | Missing required fields | Check body has userId and body |
| `500 Internal Server Error` | DB connection issue | Check backend is running |

---

## 💡 Pro Tips

1. **Always test GET first** to get real notification IDs
2. **Save responses** as examples in Postman
3. **Use Pre-request Scripts** to dynamically set tokens
4. **Create test data** with POST /create before testing updates
5. **Check unread count** before and after mark-all operations
6. **Export collection** to share with team

---

## 🚀 Example Postman Pre-request Script

Add this to automatically set the token (if using Postman OAuth flow):

```javascript
// Auto-refresh token if needed
if (pm.environment.get('jwt_token_expiry') < Date.now()) {
  // Token expired, need to login again
  console.log('Token expired, please login again');
}

// Log current token
console.log('Using token: ' + pm.environment.get('jwt_token').substring(0, 20) + '...');
```

---

Done! ✅ You now have everything to test the Notification API in Postman.
