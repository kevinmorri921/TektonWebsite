# Quick Setup Guide - ngrok External Access

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```powershell
cd backend
npm install
```

### 2. Create Environment Files

**`.env` in project root:**
```env
# Frontend uses this to configure API URL
# For LOCAL development (default)
VITE_API_URL=http://localhost:5000

# For EXTERNAL access via ngrok (uncomment when using ngrok)
# VITE_API_URL=https://your-ngrok-subdomain.ngrok.io
```

**`backend/.env` (if not exists):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret-key
ALLOWED_ORIGINS=http://localhost:5173,https://*.ngrok.io
```

### 3. Terminal 1 - Start Backend
```powershell
cd backend
npm start    # or: npm run dev (with nodemon)
```

Expected output:
```
🔧 [STARTUP] Environment: development
🔧 [STARTUP] PORT: 5000, HOST: 0.0.0.0
✅ Server running at:
   - Local: http://localhost:5000
   - Network: http://YOUR_IP:5000
```

### 4. Terminal 2 - Start Frontend
```powershell
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 5. Terminal 3 - ngrok Tunnel (Optional - for external access)
```powershell
ngrok http 5000
```

Example output:
```
Session Status                online
Forwarding                    https://abc123xyz-789.ngrok.io -> http://localhost:5000
```

### 6. Update Frontend for External Access

When using ngrok, update `.env`:
```env
VITE_API_URL=https://abc123xyz-789.ngrok.io
```

Then restart frontend:
```powershell
# In Terminal 2
# Stop with Ctrl+C, then:
npm run dev
```

---

## 🧪 Test Your Setup

### Test Local Access
```powershell
# Backend is running at http://localhost:5000
curl http://localhost:5000/api/health

# Frontend is running at http://localhost:5173
# Open browser to http://localhost:5173
```

### Test ngrok Access (after tunnel is running)
```powershell
# Replace with your actual ngrok URL
curl https://abc123xyz-789.ngrok.io/api/health
```

### Test API Call from Frontend
1. Open `http://localhost:5173`
2. Try login - should work if backend is accessible
3. Check browser console (F12) for network requests
4. Should see requests to `${VITE_API_URL}/api/...`

---

## 📊 What Changed

| File | Change |
|------|--------|
| `backend/server.js` | Now binds to 0.0.0.0 instead of localhost |
| `backend/middleware/securityConfig.js` | Supports ngrok CORS |
| `backend/package.json` | Added compression middleware |
| `src/utils/apiClient.js` | NEW - Centralized API config |
| `src/**/*.jsx` (12 files) | All use `API_BASE_URL` instead of hardcoded URLs |

---

## 🔧 Development vs Production

### Development (Local)
```env
VITE_API_URL=http://localhost:5000
NODE_ENV=development
```
- Backend on 0.0.0.0:5000
- Frontend on localhost:5173
- CORS allows ngrok subdomains

### Development (ngrok)
```env
VITE_API_URL=https://your-ngrok-subdomain.ngrok.io
NODE_ENV=development
```
- ngrok tunnel: `ngrok http 5000`
- Same code, just different URL
- Perfect for testing external access

### Production
```env
VITE_API_URL=https://api.yourdomain.com
NODE_ENV=production
```
- Remove ngrok support
- Use real domain
- Enable security headers

---

## 🚨 Common Issues & Fixes

### ❌ CORS Error
```
Access to XMLHttpRequest at 'http://localhost:5000/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix**: Backend not running or CORS middleware not loaded
```powershell
# Verify backend is running:
curl http://localhost:5000/api/health
```

### ❌ 404 Not Found
```
GET http://localhost:5000/api/login 404 (Not Found)
```

**Fix**: Check API endpoint exists and URL is correct
```powershell
# Test endpoint:
curl http://localhost:5000/api/login
```

### ❌ ERR_CONNECTION_REFUSED
```
GET http://localhost:5000/... net::ERR_CONNECTION_REFUSED
```

**Fix**: Backend is not running
```powershell
# Start backend:
cd backend && npm start
```

### ❌ ngrok URL not responding
```
curl: (7) Failed to connect to xxx.ngrok.io port 443
```

**Fix**: 
1. Verify ngrok is running: `ngrok http 5000`
2. Verify backend is running: `npm start`
3. Check frontend `.env` has correct ngrok URL
4. Restart frontend if you changed `.env`

---

## 📝 Logs to Check

### Backend Startup
```
🔧 [STARTUP] Environment: development
🔧 [STARTUP] PORT: 5000, HOST: 0.0.0.0
✅ Server listening on http://0.0.0.0:5000
```

### API Requests
```
[API] POST /api/login - User logged in
[API] GET /api/events - Retrieved events
```

### CORS Issues
```
[CORS] Origin not allowed: http://wrong-url
[CORS] Valid origins: http://localhost:5173, https://*.ngrok.io
```

---

## ✅ Checklist Before Going Live

- [ ] Backend runs with `npm start`
- [ ] Frontend runs with `npm run dev`
- [ ] Can login locally at `http://localhost:5173`
- [ ] API calls show in Network tab with correct URL
- [ ] ngrok tunnel working: `ngrok http 5000`
- [ ] Frontend `.env` has correct `VITE_API_URL`
- [ ] External ngrok URL accessible
- [ ] Login works via ngrok tunnel
- [ ] All features work (Dashboard, Profile, Settings, etc.)

---

## 🔗 Useful Commands

```powershell
# Backend
cd backend
npm install           # Install dependencies
npm start            # Run server
npm run dev          # Run with nodemon (auto-reload)

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# ngrok
ngrok http 5000      # Expose port 5000
ngrok config        # View configuration
```

---

## 📚 For More Details

See: `NGROK_IMPLEMENTATION_COMPLETE.md` (full documentation)

---

**Last Updated**: 2024  
**Status**: Ready to Use  
**Next**: Follow the 5-minute setup above!
