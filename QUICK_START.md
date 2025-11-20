# 🚀 Quick Start Reference

## What Was Wrong
❌ Login/Signup pages couldn't communicate with database due to:
1. Super admin password failed validation
2. Missing CORS configuration
3. Script wasn't loading environment variables

## What's Fixed Now ✅
✅ All issues resolved  
✅ Backend running and ready  
✅ Database connected  
✅ Frontend can now talk to backend

---

## 30-Second Quick Start

### Start Backend
```bash
cd backend
node server.js
```
✓ Should show: `🚀 Server running on http://localhost:5000`

### Start Frontend
```bash
# In new terminal
npm run dev
```
✓ Should show: `Local: http://localhost:5173`

### Login & Test
1. Open http://localhost:5173/login
2. Email: `super_admin@tekton.com`
3. Password: `SuperAdmin@2024`
4. Click LOGIN

---

## Default Test Account
```
Email: super_admin@tekton.com
Password: SuperAdmin@2024
```

---

## Create New Users
1. Go to http://localhost:5173/signup
2. Fill form with password like: `MyPass@123`
   - Must have: uppercase + lowercase + number + special char
3. Click SIGN UP
4. Go to login and test

---

## Valid Password Examples
- `SuperAdmin@2024` ✓
- `MyPass@123` ✓
- `Test@Pass99` ✓
- `Secure#2024` ✓

## Invalid Passwords
- `password` ✗ (missing uppercase, number, special char)
- `Password123` ✗ (missing special character)
- `pass@123` ✗ (missing uppercase)

---

## API Endpoints
```
POST /api/signup
POST /api/login
```

---

## Troubleshooting 1-Minute Guide

| Problem | Fix |
|---------|-----|
| Can't login | Is backend running? Check `node server.js` |
| "Can't reach server" | Backend not running on port 5000 |
| "CORS error" | Frontend not on localhost:5173 or backend not running |
| "Password validation failed" | Password missing uppercase/lowercase/number/special char |
| "User not found" | Email doesn't exist, try signup or use super_admin account |
| Blank page on localhost:5173 | Frontend not running, check `npm run dev` |

---

## Verify Everything Works

### Test Backend
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","uptime":...}
```

### Test Signup API
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"fullname":"Test","email":"test123@example.com","password":"Test@1234","confirmPassword":"Test@1234"}'
```

### Test Login API
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super_admin@tekton.com","password":"SuperAdmin@2024"}'
```

---

## Files You Need to Know
- Backend entry: `backend/server.js`
- Frontend entry: `src/main.jsx`
- Login page: `src/Login/Login.jsx`
- Signup page: `src/Signup/Signup.jsx`
- Config: `backend/.env`

---

## What's Connected
✅ Frontend (localhost:5173) ↔️ Backend (localhost:5000) ↔️ MongoDB

---

**Everything is working. Just start backend and frontend, then login!**
