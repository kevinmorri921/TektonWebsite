# 🚀 TektonWebsite + ngrok - Quick Start (5 Minutes)

## What You Need

- [ ] ngrok installed
- [ ] ngrok account & authtoken
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)

---

## ⚡ Super Quick Setup

### 1️⃣ Install & Authenticate ngrok

```powershell
# Install
scoop install ngrok

# Get token: https://dashboard.ngrok.com/auth/your-authtoken

# Authenticate
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 2️⃣ Start Your Servers

```powershell
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

### 3️⃣ Start ngrok Tunnels

```powershell
# Terminal 3: Backend tunnel
ngrok http 5000 --region us

# Terminal 4: Frontend tunnel
ngrok http 5173 --region us
```

### 4️⃣ Get Your URLs

```
Example output from ngrok terminals:
Forwarding  https://a1b2c3d4.ngrok.io -> http://localhost:5000
Forwarding  https://e5f6g7h8.ngrok.io -> http://localhost:5173
```

### 5️⃣ Update Configuration

#### Update `backend/.env`

```dotenv
ALLOWED_ORIGINS=http://localhost:5173,https://e5f6g7h8.ngrok.io
```

#### Update `.env` (frontend)

```env
VITE_API_URL=https://a1b2c3d4.ngrok.io
```

### 6️⃣ Restart Backend

```powershell
# Stop and restart backend (Terminal 1)
# Ctrl+C to stop
# npm start to restart
```

### 7️⃣ Access Publicly

```
Open: https://e5f6g7h8.ngrok.io
Share with: https://e5f6g7h8.ngrok.io
```

---

## 🎯 Using the Helper Scripts

### Option A: Automated Setup

```powershell
.\start-public.ps1
```
Starts everything automatically!

### Option B: Manual with Help

```powershell
.\setup-ngrok-urls.ps1
```
Interactive guide to configure URLs

### Option C: Tunnel Manager

```powershell
.\ngrok-tunnel-manager.ps1
```
Advanced control over tunnels

---

## 📋 Cheat Sheet

| What | Command |
|------|---------|
| Install ngrok | `scoop install ngrok` |
| Get token | https://dashboard.ngrok.com/auth/your-authtoken |
| Authenticate | `ngrok config add-authtoken TOKEN` |
| Check config | `ngrok config check` |
| Backend tunnel | `ngrok http 5000 --region us` |
| Frontend tunnel | `ngrok http 5173 --region us` |
| Dashboard | http://127.0.0.1:4040 |
| See URLs | Look at tunnel terminal output |

---

## ⚠️ Common Issues

### "ngrok command not found"
```powershell
scoop install ngrok
# OR add C:\ngrok to PATH
```

### "Port 5000 already in use"
```powershell
# Kill the process
Get-NetTCPConnection -LocalPort 5000
Stop-Process -Id [PID] -Force
```

### "CORS error"
```dotenv
# Add to backend/.env
ALLOWED_ORIGINS=...,https://your-ngrok-frontend-url.ngrok.io
# Then restart backend
```

### "404 on API calls"
```env
# Frontend .env must have:
VITE_API_URL=https://your-ngrok-backend-url.ngrok.io
```

### "Tunnel URL keeps changing"
```
This is normal for free tier!
Just update .env files with new URLs
(Or upgrade to ngrok Pro for static URLs)
```

---

## 🔒 Security Checklist

- ✅ MongoDB is encrypted (TLS/SSL)
- ✅ JWT tokens secure
- ✅ CORS validates origin
- ✅ Don't share URLs with untrusted people
- ✅ Monitor dashboard at http://127.0.0.1:4040
- ✅ Keep PC secure (tunnels expose your localhost)

---

## 📖 Full Documentation

See `NGROK_PUBLIC_SETUP_GUIDE.md` for complete guide with all details.

---

## 🆘 Need Help?

1. Check `NGROK_PUBLIC_SETUP_GUIDE.md` - Step 10 has error solutions
2. Run: `ngrok config check`
3. Visit: http://127.0.0.1:4040 (dashboard)
4. Check browser console for CORS errors

---

**Your app is now publicly accessible! 🎉**

Questions? See the full guide: `NGROK_PUBLIC_SETUP_GUIDE.md`
