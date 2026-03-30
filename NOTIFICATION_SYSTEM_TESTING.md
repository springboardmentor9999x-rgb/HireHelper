# Notification System - Quick Start Testing Guide

## Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:4200`
- Valid JWT token for authentication
- PostgreSQL notifications table exists

---

## Step 1: Verify Database Table

```sql
-- Check if notifications table exists
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Create test notifications
INSERT INTO notifications (user_id, body, is_read, created_at)
VALUES 
  ('YOUR_USER_ID', 'Test notification 1', false, CURRENT_TIMESTAMP),
  ('YOUR_USER_ID', 'Test notification 2', false, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
  ('YOUR_USER_ID', 'Test notification 3', true, CURRENT_TIMESTAMP - INTERVAL '1 hour');
```

---

## Step 2: Test Backend API

### Get JWT Token
Login at `http://localhost:4200/login` and get token from browser DevTools (Network tab)

### Test Get Notifications
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "user_id": "user-uuid",
      "body": "Test notification 1",
      "is_read": false,
      "created_at": "2026-03-27T10:30:00.000Z"
    }
    // ... more notifications
  ]
}
```

### Test Get Unread Count
```bash
curl -X GET http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "success": true,
  "count": 2
}
```

### Test Mark Single As Read
```bash
curl -X PUT http://localhost:3000/api/notifications/read/NOTIFICATION_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "success": true,
  "message": "Notification marked as read",
  "data": { ... }
}
```

### Test Mark All As Read
```bash
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "success": true,
  "message": "Marked 2 notifications as read",
  "data": [ ... ]
}
```

### Test Create Notification (Admin)
```bash
curl -X POST http://localhost:3000/api/notifications/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "body": "This is a test notification"
  }'

# Expected Response:
{
  "success": true,
  "message": "Notification created successfully",
  "data": { ... }
}
```

### Test Delete Notification
```bash
curl -X DELETE http://localhost:3000/api/notifications/NOTIFICATION_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Step 3: Test Frontend UI

### 1. Navigate to Dashboard
- Go to `http://localhost:4200/dashboard`
- Look for bell icon (🔔) in top-right corner with red badge showing unread count

### 2. Click Bell Icon
- Sidebar should slide in from right
- Display all notifications
- Show "X unread" at bottom

### 3. Test Mark As Read
- Click on an unread notification (light blue background)
- Should highlight as read (white background)
- Unread dot should disappear
- Badge count should decrease

### 4. Test Mark All As Read
- Click "✓ Mark all as read" button
- All notifications should become read
- Badge count should become 0
- Button should be disabled (grayed out)

### 5. Test Delete
- Hover over a notification
- Delete button (✕) appears on right
- Click to delete
- Notification disappears from list

### 6. Test Auto-Refresh
- Open sidebar
- Create new notification via API curl (in another terminal)
- Wait 10 seconds
- New notification should appear in sidebar

### 7. Test Close Sidebar
- Click outside the sidebar (overlay)
- Or click the close button (✕)
- Sidebar should slide out smoothly

---

## Step 4: Angular Service Testing

### Test in Browser Console
```javascript
// Inject the service (if accessible)
// Open DevTools > Console

// Get notifications
notificationService.getNotifications().subscribe(
  response => console.log('Notifications:', response)
);

// Mark as read
notificationService.markAsRead('notification-uuid').subscribe(
  response => console.log('Marked as read:', response)
);

// Mark all as read
notificationService.markAllAsRead().subscribe(
  response => console.log('All marked as read:', response)
);

// Get unread count
notificationService.getUnreadCount().subscribe(
  response => console.log('Unread count:', response)
);
```

---

## Step 5: Visual Features Checklist

- [ ] Bell icon visible in top-right
- [ ] Red badge shows unread count
- [ ] Sidebar slides in from right (smooth animation)
- [ ] Overlay appears behind sidebar
- [ ] Header shows "Notifications" title
- [ ] Close button (✕) works
- [ ] "Mark all as read" button present
- [ ] Unread notifications have:
  - [ ] Light blue background (#f0f9ff)
  - [ ] Blue left border
  - [ ] Pulsing blue dot indicator
- [ ] Read notifications have light gray background
- [ ] Relative time display works (5m ago, 2h ago, etc.)
- [ ] Delete button appears on hover
- [ ] Scrollbar visible if many notifications
- [ ] Empty state shows when no notifications
- [ ] Loading spinner shows while fetching
- [ ] "X unread" count at bottom

---

## Step 6: Performance Testing

### Monitor Auto-Refresh
1. Open DevTools > Network tab
2. Open notifications sidebar
3. Every 10 seconds, check for new requests to `/api/notifications`

### Check for Memory Leaks
1. Open DevTools > Memory tab
2. Take heap snapshot
3. Close sidebar
4. Reload page
5. Check heap size hasn't increased significantly

---

## Step 7: Error Scenarios

### Test 404 (Wrong Notification ID)
```bash
curl -X PUT http://localhost:3000/api/notifications/read/invalid-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return 404: Notification not found
```

### Test Missing Auth
```bash
curl -X GET http://localhost:3000/api/notifications

# Should return 401: Unauthorized
```

### Test Bad Request
```bash
curl -X POST http://localhost:3000/api/notifications/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id"}'  # Missing body

# Should return 400: body is required
```

---

## Troubleshooting

### Bell Icon Not Showing
- [ ] Check layout.ts is imported in your route
- [ ] Check notification-sidebar component is declared
- [ ] Open browser console for errors

### Sidebar Not Opening
- [ ] Check `toggleNotificationSidebar()` is called
- [ ] Check `showNotificationSidebar` flag logic
- [ ] Check CSS for `.notification-sidebar.open` class

### Notifications Not Loading
- [ ] Check API endpoint returns data (test with curl)
- [ ] Check JWT token is valid
- [ ] Check backend is running
- [ ] Open browser console for error messages

### Auto-Refresh Not Working
- [ ] Verify `interval(10000)` is properly subscribed
- [ ] Check component's `ngOnDestroy` is called
- [ ] Check Network tab for 10-second interval requests

### Styling Issues
- [ ] Check CSS file is imported
- [ ] Clear browser cache
- [ ] Verify CSS variables are defined (--spacing-*, --radius-*, etc.)

---

## Production Checklist

- [ ] Backend exceptions handled gracefully
- [ ] Frontend error messages user-friendly
- [ ] JWT token refresh working properly
- [ ] Notifications table indexed on user_id
- [ ] Auto-refresh interval appropriate (not too frequent)
- [ ] Memory leaks eliminated
- [ ] Cross-browser tested
- [ ] Mobile responsive tested
- [ ] Security: Users can only see own notifications
- [ ] Performance: API responds within 200ms

---

## Advanced Testing

### Load Test (Create Many Notifications)
```bash
# Create 50 test notifications
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/notifications/create \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"YOUR_USER_ID\",\"body\":\"Test notification $i\"}"
done
```

### Bulk Operations Test
```bash
# Mark all as read
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Then verify all have is_read = true
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'YOUR_USER_ID' AND is_read = false;
# Should return 0
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify database connectivity
4. Test API endpoints with curl first
5. Review component imports and declarations

