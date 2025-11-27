# System Information Analytics - Implementation Guide

## 📋 Overview
Complete System Information Analytics module for admin dashboard with privacy consent, device detection, and real-time analytics.

---

## 📦 Files Created/Modified

### Frontend Files Created:
1. **`src/Analytics/SystemInformation.jsx`** - Main analytics component
   - Privacy consent banner
   - Device information collection
   - Real-time analytics charts (OS, Browser, Device Type, Network)
   - Device detection engine
   - localStorage consent management

### Frontend Files Modified:
1. **`src/AdminPanel/AdminPanel.jsx`**
   - Added `canAccessSystemInfo` permission check
   - Updated navigation to include System Information button
   - Button only visible to Super Admin and Admin roles
   - Navigation click handler to route to `/system-information`

2. **`src/App.jsx`**
   - Added route for `/system-information`
   - Imported `SystemInformation` component

### Backend Files Created:
1. **`backend/routes/system-info.js`** - API routes
   - `POST /api/system-info` - Collect system information
   - `GET /api/system-info/analytics` - Fetch aggregated analytics

2. **`backend/models/systemInfo.js`** - MongoDB schema
   - Stores all system information with indexes
   - Timestamps and user association

### Backend Files Modified:
1. **`backend/server.js`**
   - Imported system info routes
   - Registered routes at `/api/system-info`

---

## 🔐 Permission Logic

**Only accessible by:**
- Super Admin (`super_admin`)
- Admin (`admin`)

**Permission check:**
```javascript
const userRole = currentUser?.role?.toLowerCase();
const canAccessSystemInfo = userRole && ["super_admin", "admin"].includes(userRole);
```

---

## 📊 System Information Collected

### Client-Side Detection:
- **Operating System** - Windows, macOS, Linux, Android, iOS
- **Browser** - Name and version (Chrome, Firefox, Safari, Edge)
- **Screen Resolution** - e.g., 1920x1080
- **Device Type** - Desktop, Tablet, Mobile
- **CPU Cores** - Processor core count
- **RAM** - Available memory (if supported)
- **Language** - Browser language preference
- **Timezone** - User's timezone
- **Network Type** - 4g, 3g, 2g, unknown
- **GPU** - WebGL renderer (if available)
- **User Agent** - Full browser identification string

### Server-Side Collection:
- **IP Address** - User's IP from request
- **Timestamp** - When data was collected
- **User ID** - Associated user from JWT token

---

## 🛡️ Privacy & Consent

### Consent Flow:
1. First visit to System Information shows privacy banner
2. Banner explains data collection purpose
3. User must accept to proceed
4. Consent stored in localStorage as `systemInfoConsent: "true"`
5. User can withdraw consent (stored as "false")

### Privacy Features:
- No automatic collection without consent
- Data stored securely in MongoDB
- Used only for analytics and system monitoring
- Clear notice about data usage
- Easy withdrawal option

---

## 📈 Analytics Available

### Aggregated Statistics:
1. **OS Usage** - Pie chart showing operating system distribution
2. **Browser Usage** - Pie chart showing browser distribution
3. **Device Type Usage** - Pie chart (Desktop/Tablet/Mobile)
4. **Network Type Usage** - Pie chart showing network conditions
5. **Top 10 Devices** - Table showing most common device combinations

### Charts Used:
- Chart.js with React wrapper
- Pie charts for distribution
- Responsive design

---

## 🗄️ MongoDB Schema

```javascript
SystemInfo: {
  userId: ObjectId (indexed),
  ipAddress: String,
  os: String,
  browser: {
    name: String,
    version: String
  },
  screenResolution: String,
  deviceType: String,
  cpuArchitecture: String,
  language: String,
  timezone: String,
  networkType: String,
  ram: String,
  gpu: String,
  userAgent: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- userId + timestamp (for fast user queries)
- os (for aggregation)
- deviceType (for aggregation)
```

---

## 🔌 API Endpoints

### 1. POST `/api/system-info`
**Purpose:** Collect and store system information

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "os": "Windows",
  "browser": {
    "name": "Chrome",
    "version": "120.0.0"
  },
  "screenResolution": "1920x1080",
  "deviceType": "Desktop",
  "cpuArchitecture": "8 cores",
  "language": "en-US",
  "timezone": "America/New_York",
  "networkType": "4g",
  "ram": "16GB",
  "gpu": "ANGLE (Intel HD Graphics)",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "System information collected successfully",
  "data": { ...systemInfoObject }
}
```

**Error Responses:**
- 401: Unauthorized (no token or invalid token)
- 500: Server error

---

### 2. GET `/api/system-info/analytics`
**Purpose:** Fetch aggregated analytics

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "osUsage": [
    { "_id": "Windows", "count": 45 },
    { "_id": "macOS", "count": 23 }
  ],
  "browserUsage": [
    { "_id": "Chrome", "count": 50 },
    { "_id": "Firefox", "count": 18 }
  ],
  "deviceTypeUsage": [
    { "_id": "Desktop", "count": 55 },
    { "_id": "Mobile", "count": 13 }
  ],
  "networkTypeUsage": [
    { "_id": "4g", "count": 40 },
    { "_id": "3g", "count": 28 }
  ],
  "topDevices": [
    {
      "deviceType": "Desktop",
      "os": "Windows",
      "browser": "Chrome",
      "count": 28
    }
  ]
}
```

---

## 🎨 UI Components

### Main Layout:
- Header with back button and title
- Notification area (success/error messages)
- Current device info cards (10 cards in grid)
- Four analytics charts (pie charts)
- Top devices table
- Refresh button

### Colors (Tailwind):
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Purple: (#8B5CF6)

### Responsive:
- Grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Charts: Stack on mobile, 2x2 grid on desktop
- Table: Horizontal scroll on mobile

---

## 🚀 Deployment Steps

### 1. Install Dependencies (if needed):
```bash
npm install chart.js react-chartjs-2
```

### 2. Backend Setup:
- Import model: `import SystemInfo from "../models/systemInfo.js"`
- Route registered in server.js
- Environment variables already configured

### 3. Database:
- MongoDB will auto-create collection
- Indexes created on schema definition

### 4. Frontend:
- Route added to App.jsx
- Component renders at `/system-information`
- Button visible in AdminPanel only for authorized users

---

## ✅ Testing Checklist

- [ ] Login as Super Admin
- [ ] Navigate to Admin Panel
- [ ] See "System Information" button (only for admin)
- [ ] Click button → shown privacy consent banner
- [ ] Accept consent → data collection starts
- [ ] View device info cards populated
- [ ] See analytics charts loading
- [ ] Check "Most Used Devices" table
- [ ] Click Refresh button → data updates
- [ ] Logout and login → consent persists
- [ ] Test as Encoder (should not see button)
- [ ] Test as Researcher (should not see button)

---

## 🔧 Customization

### Add New System Properties:
1. Add to `collectSystemInfo()` in SystemInformation.jsx
2. Add to request body in `collectAndSendSystemInfo()`
3. Add to schema in systemInfo.js
4. Add to aggregation pipeline in backend route

### Add New Charts:
1. Fetch data from `/api/system-info/analytics`
2. Add new aggregation in backend route
3. Create new chart component with Chart.js
4. Add to grid layout

### Modify Permissions:
Edit AdminPanel.jsx:
```javascript
const canAccessSystemInfo = userRole && ["super_admin", "admin", "encoder"].includes(userRole);
```

---

## 📝 Environment Configuration

No additional environment variables needed. Uses existing:
- `JWT_SECRET` - For token verification
- `MONGODB_URI` - For data storage
- `NODE_ENV` - For error handling

---

## 🐛 Error Handling

### Frontend Errors:
- Authorization failure → shows access denied screen
- Network errors → shows error notification
- Failed consent → allows retry
- API failures → logged to console, user notified

### Backend Errors:
- Missing token → 401 Unauthorized
- Invalid token → 401 Unauthorized
- Database errors → 500 Server Error
- All errors logged with detailed context

---

## 📊 Performance

### Database Queries:
- Aggregation pipelines optimized
- Indexes on userId and os fields
- Fast group operations

### Frontend:
- Lazy loads charts (only rendered when mounted)
- Consent stored locally (no repeated checks)
- Single API call for analytics

### Storage:
- SystemInfo collection grows over time
- Consider archiving old records (>6 months)

---

## 🔐 Security Features

1. **JWT Authentication** - All endpoints require valid token
2. **Role-Based Access** - Only Admin/Super Admin can access
3. **IP Logging** - Requests tracked by IP for audit
4. **Data Validation** - All inputs sanitized
5. **Consent Required** - User consent before data collection
6. **Secure Schema** - Password never stored for system info

---

## 📞 Support

For issues or feature requests:
1. Check browser console for errors
2. Check server logs for backend errors
3. Verify JWT token validity
4. Ensure MongoDB connection active
5. Check database indexes created

---

## 🎉 Ready to Use!

The System Information Analytics module is now fully functional and ready for production use. All components are integrated, database schema is defined, and security is configured.

**Happy monitoring!** 📊
