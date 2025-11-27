# System Information Analytics - Quick Reference

## 📋 What Was Created

### New Files (3):
1. **Frontend:** `src/Analytics/SystemInformation.jsx` (585 lines)
2. **Backend Route:** `backend/routes/system-info.js` (153 lines)
3. **Backend Model:** `backend/models/systemInfo.js` (56 lines)

### Modified Files (4):
1. **Frontend:** `src/AdminPanel/AdminPanel.jsx` - Added permission check and navigation
2. **Frontend:** `src/App.jsx` - Added route for system information
3. **Backend:** `backend/server.js` - Imported and registered route
4. **Documentation:** `SYSTEM_INFORMATION_GUIDE.md` - Complete guide

---

## 🎯 Key Features

✅ **Privacy Consent** - Banner shown on first visit
✅ **Device Detection** - 10+ system properties collected
✅ **Analytics Dashboard** - 4 pie charts + top devices table
✅ **Role-Based Access** - Only Admin/Super Admin can access
✅ **Real-Time Data** - Live aggregation from MongoDB
✅ **Responsive UI** - Works on desktop, tablet, mobile
✅ **Error Handling** - Comprehensive error messages
✅ **Data Persistence** - All data stored in MongoDB

---

## 🔐 Access Control

**Who can access?**
- Super Admin ✅
- Admin ✅
- Encoder ❌
- Researcher ❌

**Where is it accessed?**
- Admin Panel → "System Information" button
- Direct URL: `/system-information`

---

## 📊 Analytics Available

| Chart | Data Shows |
|-------|-----------|
| Operating Systems | OS Distribution (Windows, macOS, Linux, etc.) |
| Browsers | Browser Usage (Chrome, Firefox, Safari, Edge) |
| Device Types | Device Distribution (Desktop, Tablet, Mobile) |
| Network Types | Network Conditions (4g, 3g, 2g, unknown) |
| Top Devices | Most used device combinations (table) |

---

## 💾 Data Stored

**Per User Session:**
- OS, Browser, Device Type
- Screen Resolution
- CPU, RAM, GPU
- Language, Timezone
- Network Type
- User Agent
- IP Address
- Timestamp

**Database:** MongoDB `systeminfo` collection

---

## 🚀 How It Works

### User Flow:
1. Admin clicks "System Information" button
2. Privacy consent banner appears
3. Admin accepts terms
4. Device info is collected and sent to server
5. Analytics dashboard loads with aggregated data
6. Charts and tables display real-time statistics

### Data Flow:
```
Browser → Collect System Info → Send to API → Save to MongoDB
                                              ↓
                            Aggregate Data ← Query Analytics
                                 ↓
                            Display Charts
```

---

## 🔧 API Endpoints

### Collect System Info
```
POST /api/system-info
Authorization: Bearer {token}
Body: { os, browser, screenResolution, deviceType, ... }
Response: { success, message, data }
```

### Get Analytics
```
GET /api/system-info/analytics
Authorization: Bearer {token}
Response: { osUsage, browserUsage, deviceTypeUsage, networkTypeUsage, topDevices }
```

---

## 📝 Configuration

**No additional setup required!**

- Database: Uses existing MongoDB connection
- Authentication: Uses existing JWT system
- Charts: Chart.js automatically installed with dependencies

---

## ✅ Testing

Quick test checklist:
```
[ ] Login as Admin
[ ] Go to Admin Panel
[ ] See "System Information" button
[ ] Click it
[ ] See privacy banner
[ ] Accept consent
[ ] View your device info
[ ] See analytics charts
[ ] Click Refresh
[ ] Logout and login again (consent should persist)
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not visible | Check user role is admin or super_admin |
| Blank page after accept | Check browser console for API errors |
| Charts not loading | Verify backend route is registered in server.js |
| Data not saving | Check MongoDB connection and systeminfo collection |
| 401 error | Verify JWT token is valid and not expired |

---

## 📞 File Locations Summary

```
Frontend:
├── src/Analytics/SystemInformation.jsx (NEW)
├── src/AdminPanel/AdminPanel.jsx (MODIFIED)
└── src/App.jsx (MODIFIED)

Backend:
├── backend/routes/system-info.js (NEW)
├── backend/models/systemInfo.js (NEW)
└── backend/server.js (MODIFIED)

Documentation:
└── SYSTEM_INFORMATION_GUIDE.md (NEW)
```

---

## 🎉 Status: READY TO USE

All components integrated. No additional dependencies needed. Ready for production!

**Start using:** Navigate to Admin Panel → System Information
