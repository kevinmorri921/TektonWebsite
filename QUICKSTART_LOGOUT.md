# Event Log Sign-Out - Quick Start Guide

## What Was Done

The Event Log module has been updated to automatically record user SIGN-OUT events in MongoDB with complete details (timestamp, username, email, role, IP address).

## Key Changes

### 1. New Logout Endpoint
- **URL:** `POST /api/logout`
- **Authentication:** Requires JWT token
- **What it does:** Logs the sign-out event to MongoDB

### 2. New Fields in Event Log
The database now captures sign-out events with:
- ✅ Exact timestamp
- ✅ Username and email
- ✅ User role (admin, encoder, researcher, etc.)
- ✅ IP address
- ✅ Event type: "Sign Out"

### 3. Updated UI
The Event Log displays a new **Role** column showing each user's role at the time of the event.

---

## Testing Sign-Out Logging

### Manual Test Steps:

1. **Start the application:**
   ```bash
   cd backend && npm start    # Terminal 1
   cd frontend && npm run dev # Terminal 2
   ```

2. **Login to the application**
   - Go to http://localhost:5173/login
   - Enter test credentials

3. **Sign out from any page:**
   - **Admin Panel:** Click "Sign Out" button in sidebar
   - **Dashboard:** Click "Log Out" button in sidebar
   - **Profile Page:** Click "Log Out" button in sidebar

4. **Verify the sign-out event was logged:**
   - Go back to login
   - Login again as admin
   - Navigate to **Admin Panel** → **Event Log**
   - You should see your recent sign-out event with:
     - Your username
     - Your email
     - Your role (e.g., "admin")
     - "Sign Out" badge (slate gray)
     - Your IP address in the Details column

5. **Test filtering:**
   - In Event Log, use the "Action" filter dropdown
   - Select "Sign Out"
   - Should show only sign-out events

6. **Test CSV export:**
   - Click "Export CSV"
   - Open the file - verify Role column is included

---

## What Remains Unchanged

✅ **All existing event types still work:**
- Login events
- Upload Marker events
- Download File events
- Created Survey events
- Updated Survey events
- Deleted Marker events

✅ **Existing functionality:**
- User accounts
- Authentication
- Dashboard
- Profile page
- File uploads
- Surveys
- All other features

---

## Database Structure

### New Fields in ActivityLog Collection:
```javascript
{
  _id: ObjectId,
  username: String,              // e.g., "John Doe"
  email: String,                 // e.g., "john@example.com"
  action: String,                // e.g., "Sign Out"
  role: String,                  // e.g., "admin" (NEW FIELD)
  ipAddress: String,             // e.g., "192.168.1.1" (NEW FIELD)
  details: String,               // e.g., "Signed out from 192.168.1.1"
  userId: null,                  // Always null for sign-out (per design)
  createdAt: Date,               // Automatic timestamp
  updatedAt: Date                // Automatic timestamp
}
```

---

## API Reference

### POST /api/logout

**Request:**
```bash
curl -X POST http://localhost:5000/api/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Server error during logout"
}
```

**Notes:**
- This endpoint is called automatically by all logout buttons
- You don't need to call it manually - the UI handles it
- Even if logging fails, the user is still logged out locally

---

## Event Log Columns

| Column | Shows | Example |
|--------|-------|---------|
| Date & Time | When it happened | Jan 15, 2024 10:30:45 |
| Username | User's name | John Doe |
| Email | User's email | john@example.com |
| Role | User's role | admin |
| Action | Type of action | Sign Out |
| Details | Additional info | Signed out from 192.168.1.100 |

---

## Filtering & Export

### Filter by Action:
- All Actions
- Login
- **Sign Out** ← NEW
- Uploaded Marker
- Downloaded File
- Created Survey
- Updated Survey
- Deleted Marker

### Search:
Searches across username, email, role, action, and details

### Export CSV:
Exports all visible logs as CSV file with Role column included

---

## Troubleshooting

### Sign-out event not appearing in log:
1. Make sure you're logged in as admin
2. Go to Admin Panel → Event Log
3. Click "Refresh List"
4. Check if you recently signed out
5. Try filtering by "Sign Out" action

### Role showing as "-" in Event Log:
- This shouldn't happen - the role is captured from the JWT token
- If it occurs, the user's role may not be set in the database
- Check user record in MongoDB

### MongoDB errors:
- Ensure MongoDB is running
- Check connection string in backend config
- Check MONGO_URI environment variable

### Logout button not working:
- Clear browser cache and localStorage
- Try in incognito/private mode
- Check browser console for errors
- Check backend logs for issues

---

## File Locations

**Backend:**
- Model: `backend/models/activityLog.js`
- Route: `backend/routes/logout.js`
- Server config: `backend/server.js`

**Frontend:**
- Component: `src/EventLog/EventLog.jsx`
- Admin Panel: `src/AdminPanel/AdminPanel.jsx`
- Dashboard: `src/Dashboard/Dashboard.jsx`
- Profile: `src/Profile/Profile.jsx`

---

## Support & Documentation

For detailed implementation information, see:
- `SIGNIN_LOGOUT_IMPLEMENTATION.md` - Full implementation details
- `IMPLEMENTATION_VERIFICATION.md` - Verification checklist

---

**Implementation Date:** November 25, 2025
**Status:** ✅ Production Ready
