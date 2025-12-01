# 🔧 TektonWebsite + ngrok - Complete Reference

## 📚 Documentation Overview

### Quick References
- **`NGROK_QUICK_START.md`** ← Start here! (5-minute setup)
- **`NGROK_PUBLIC_SETUP_GUIDE.md`** ← Comprehensive guide (with 10 error solutions)
- **`NGROK_REFERENCE.md`** ← This file (command reference)

### Available Scripts
```
start-public.ps1           - Automated setup (recommended)
ngrok-tunnel-manager.ps1   - Manual tunnel control
setup-ngrok-urls.ps1       - Interactive URL configuration
```

---

## 🎯 Your Setup

| Component | Port | Type | URL (local) | URL (public) |
|-----------|------|------|-------------|--------------|
| Backend | 5000 | Node.js/Express | http://localhost:5000 | https://[ngrok].ngrok.io |
| Frontend | 5173 | Vite/React | http://localhost:5173 | https://[ngrok].ngrok.io |
| Database | - | MongoDB Atlas | Remote | Encrypted |
| ngrok Dashboard | 4040 | Web UI | http://127.0.0.1:4040 | - |

---

## 🚀 Installation Step-by-Step

### 1. Install ngrok

**Method 1: Scoop (Recommended)**
```powershell
# Install Scoop (if not already installed)
iwr -useb get.scoop.sh | iex

# Install ngrok
scoop install ngrok

# Verify
ngrok --version
```

**Method 2: Manual Download**
```
1. Visit https://ngrok.com/download
2. Download Windows version
3. Extract to C:\ngrok
4. Add C:\ngrok to System PATH
```

**Method 3: Chocolatey**
```powershell
choco install ngrok
```

### 2. Create ngrok Account

```
1. Go to https://ngrok.com
2. Sign up (free account)
3. Verify email
```

### 3. Get & Configure Auth Token

```powershell
# 1. Get token from: https://dashboard.ngrok.com/auth/your-authtoken

# 2. Configure in PowerShell
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE

# 3. Verify
ngrok config check
# Output: "Configuration file valid"
```

---

## 🎮 Commands Reference

### ngrok Basic Commands

```powershell
# Display version
ngrok --version

# Check configuration
ngrok config check

# View config file location
ngrok config info

# List all active tunnels (dashboard API)
curl http://localhost:4040/api/tunnels
```

### Starting Tunnels

```powershell
# Backend tunnel (port 5000)
ngrok http 5000 --region us

# Frontend tunnel (port 5173)
ngrok http 5173 --region us

# Custom region
ngrok http 5000 --region eu  # Europe
ngrok http 5000 --region au  # Australia
ngrok http 5000 --region jp  # Japan

# Multiple protocols
ngrok tcp 5000              # TCP tunnel
ngrok http -hostname=sub.example.com 5000  # (requires paid plan)

# With custom domain (Pro plan)
ngrok http 5000 --domain=my-app.ngrok.io

# Configuration
ngrok http 5000 --bind-tls=true  # Force HTTPS only
ngrok http 5000 --subdomain=myapp  # Subdomain (Pro plan)
```

### Advanced

```powershell
# Tunnel with request/response inspection
ngrok http 5000 --inspect=false  # Disable inspection

# Multiple tunnels from config file
ngrok start-all

# Tunnel to remote server
ngrok http https://example.com:443

# TCP tunnel (for non-HTTP apps)
ngrok tcp 5432

# TLS tunnel
ngrok tls 443
```

---

## 📝 Configuration Files

### backend/.env (Example with ngrok)

```dotenv
# Server
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

# Database (MongoDB Atlas - already secure)
MONGO_URI=mongodb+srv://tsunami:tsunami1234@tsunami.rwla9w2.mongodb.net/tektonDB?retryWrites=true&w=majority

# Security
JWT_SECRET=devSecretKey123

# CORS - Add your ngrok frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://abc123-xyz789.ngrok.io

# Optional: Backend URL for frontend to reference
VITE_BACKEND_URL=https://abc123-xyz789.ngrok.io

# Security Features
CSP_ENABLED=true
SHOW_ERROR_DETAILS=true

# Timeouts
REQUEST_TIMEOUT=30000
RESPONSE_TIMEOUT=30000

# Debug
DEBUG=false
```

### frontend/.env (or .env.local)

```env
# Backend API URL - MUST match backend ngrok URL
VITE_API_URL=https://abc123-xyz789.ngrok.io

# Frontend App URL (for redirects/canonical links)
VITE_APP_URL=https://def456-uvw012.ngrok.io

# Optional: Debug mode
VITE_DEBUG=true
```

### Frontend API Client Example

```javascript
// src/api/client.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔗 API URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## 🏗️ Startup Procedures

### Option 1: Automated (Easiest)

```powershell
# Run the automated startup script
.\start-public.ps1

# This will:
# 1. Check prerequisites
# 2. Verify ngrok authentication
# 3. Start backend server
# 4. Start frontend server
# 5. Start backend ngrok tunnel
# 6. Start frontend ngrok tunnel
# 7. Display public URLs
```

### Option 2: Manual Step-by-Step

**Terminal 1: Backend Server**
```powershell
cd backend
npm start
# Wait for: "Server running on port 5000"
```

**Terminal 2: Frontend Server**
```powershell
npm run dev
# Wait for: "Local: http://localhost:5173"
```

**Terminal 3: Backend Tunnel**
```powershell
ngrok http 5000 --region us
# Note the URL: https://abc123.ngrok.io
```

**Terminal 4: Frontend Tunnel**
```powershell
ngrok http 5173 --region us
# Note the URL: https://def456.ngrok.io
```

**Terminal 5: Configure & Update**
```powershell
# Update backend/.env
# Add to ALLOWED_ORIGINS: https://def456.ngrok.io

# Update frontend/.env
# Set VITE_API_URL=https://abc123.ngrok.io
# Set VITE_APP_URL=https://def456.ngrok.io

# Restart backend server (Terminal 1)
# Ctrl+C then npm start
```

### Option 3: Interactive Configuration

```powershell
# Use the interactive setup script
.\setup-ngrok-urls.ps1

# This will:
# 1. Check if ngrok is installed
# 2. Verify authentication
# 3. Ask you to start tunnels and copy URLs
# 4. Automatically update .env files
```

---

## 🔍 Monitoring & Debugging

### ngrok Dashboard

```
Web URL: http://127.0.0.1:4040
API URL: http://127.0.0.1:4040/api
```

**What you can see:**
- All active tunnels and their URLs
- Real-time request/response inspection
- Traffic analysis
- Headers and payloads
- Response codes and latency

### API Endpoints

```powershell
# Get all active tunnels
curl http://localhost:4040/api/tunnels

# Get specific tunnel details
curl http://localhost:4040/api/tunnels/my-tunnel-name

# Get traffic statistics
curl http://localhost:4040/api/requests/http
```

### Test Your Endpoints

```powershell
# Test backend from frontend
curl https://abc123.ngrok.io/api/health

# Test with auth header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://abc123.ngrok.io/api/user/profile

# Test CORS preflight
curl -X OPTIONS https://abc123.ngrok.io/api/login -v
```

---

## 🚨 Troubleshooting

### Installation Issues

**Problem: "ngrok: command not found"**
```powershell
# Check if installed
Get-Command ngrok

# If not found, install via Scoop
scoop install ngrok

# OR add to PATH manually
$env:Path += ";C:\ngrok"
```

**Problem: "Permission denied" on script**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# OR run with bypass (one-time)
powershell -ExecutionPolicy Bypass -File .\start-public.ps1
```

### Runtime Issues

**Problem: "ERR_NGROK_102 Address already in use"**
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 5000 | Select OwningProcess

# Kill process
Stop-Process -Id [PID] -Force

# OR use different port in ngrok
ngrok http localhost:6000 --remote-addr localhost:5000
```

**Problem: "ERR_NGROK_227 Tunnel session failed"**
```powershell
# Get new auth token
# https://dashboard.ngrok.com/auth/your-authtoken

# Re-authenticate
ngrok config add-authtoken YOUR_NEW_TOKEN

# Verify
ngrok config check
```

**Problem: CORS errors in browser**
```
1. Check ALLOWED_ORIGINS in backend/.env
2. Make sure frontend ngrok URL is there
3. Restart backend server
4. Hard refresh browser (Ctrl+Shift+R)
```

**Problem: "Cannot GET /api/..."**
```
1. Check VITE_API_URL in frontend/.env
2. Make sure it matches backend ngrok URL
3. Hard refresh browser
4. Check browser console for errors
5. Check ngrok dashboard (http://127.0.0.1:4040)
```

**Problem: Tunnel URL changes constantly**
```
This is normal for free tier!

Solution 1: Update .env each time
Solution 2: Upgrade to ngrok Pro for static URLs
Solution 3: Use ngrok CLI to get URL programmatically

# Get URL from API
$response = curl http://localhost:4040/api/tunnels | ConvertFrom-Json
$publicUrl = $response.tunnels[0].public_url
```

---

## 🔒 Security Checklist

- [ ] MongoDB Atlas has IP whitelist or strong auth
- [ ] JWT_SECRET is strong and not in git
- [ ] ALLOWED_ORIGINS only includes trusted domains
- [ ] .env files are in .gitignore
- [ ] ngrok URLs are not shared publicly/permanently
- [ ] Monitor ngrok dashboard for suspicious requests
- [ ] HTTPS is enforced (ngrok does this)
- [ ] API rate limiting is in place
- [ ] Database connection string is encrypted
- [ ] Sensitive data not logged to console

---

## 📊 Performance Tips

### Optimize ngrok Tunnels

```powershell
# Use regional servers closer to you
ngrok http 5000 --region us    # USA
ngrok http 5000 --region eu    # Europe
ngrok http 5000 --region ap    # Asia-Pacific
ngrok http 5000 --region au    # Australia
ngrok http 5000 --region in    # India
ngrok http 5000 --region jp    # Japan
ngrok http 5000 --region br    # Brazil
```

### Monitor Performance

```
1. Check ngrok dashboard: http://127.0.0.1:4040
2. Look at "Latency" and "Connections/min"
3. Review request/response times
4. Check for 5xx errors
```

### Free Tier Limits

- 1 active tunnel per session
- 40 connections/minute (with account)
- 2 hour session limit
- URLs change on restart
- No WebSocket support
- No custom domains

### Upgrade Benefits (Pro Plan)

- Static URLs
- Multiple tunnels simultaneously
- 20 reserved tunnels
- Higher bandwidth limits
- WebSocket support
- OAuth authentication
- 24/7 support

---

## 📞 Getting Help

### Documentation
- ngrok Docs: https://ngrok.com/docs
- Your Docs: `NGROK_PUBLIC_SETUP_GUIDE.md` (Step 10 has error solutions)

### Commands
```powershell
# Get ngrok help
ngrok --help
ngrok http --help

# Check your setup
ngrok config check

# View configuration
ngrok config info

# Get version info
ngrok version
```

### Debugging

```powershell
# Enable verbose logging
ngrok http 5000 -log stdout

# Check local services
netstat -ano | findstr 5000

# Test API connectivity
Test-NetConnection -ComputerName localhost -Port 5000

# Test DNS
nslookup example.ngrok.io
```

---

## 🎓 Learning Resources

- **ngrok Official Docs**: https://ngrok.com/docs
- **Express CORS**: https://expressjs.com/en/resources/middleware/cors.html
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **MongoDB Connection**: https://docs.mongodb.com/manual/reference/connection-string/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## 🎯 Common Workflows

### Workflow 1: Quick Public Test
```powershell
1. cd backend && npm start
2. npm run dev
3. ngrok http 5000
4. ngrok http 5173
5. Copy URLs from ngrok terminals
6. Update .env files
7. Restart backend
8. Visit frontend URL
```

### Workflow 2: Share with Teammate
```powershell
1. Run .\start-public.ps1
2. Get public URLs from ngrok dashboard
3. Send frontend URL to teammate
4. They can now access your app!
```

### Workflow 3: Mobile Testing
```powershell
1. Start ngrok tunnels
2. Get public URL
3. Open URL on your phone (same WiFi or any)
4. Test responsive design
5. Check mobile-specific features
```

### Workflow 4: Integration Testing
```powershell
1. Start ngrok tunnels
2. Get backend URL
3. Add to external service/webhook
4. External service can now reach your API
5. Monitor dashboard for requests
```

---

## ✅ Quick Checklist

- [ ] ngrok installed (`ngrok --version`)
- [ ] ngrok authenticated (`ngrok config check`)
- [ ] Backend running (`npm start` in backend/)
- [ ] Frontend running (`npm run dev`)
- [ ] Backend tunnel started (`ngrok http 5000`)
- [ ] Frontend tunnel started (`ngrok http 5173`)
- [ ] URLs copied from ngrok terminals
- [ ] backend/.env updated with ALLOWED_ORIGINS
- [ ] frontend/.env updated with VITE_API_URL
- [ ] Backend restarted
- [ ] Frontend URL working in browser
- [ ] API calls working without CORS errors
- [ ] Database queries working
- [ ] ngrok dashboard accessible (http://127.0.0.1:4040)

---

## 📈 Next Steps

1. **Immediate**: Get your app publicly accessible with ngrok
2. **Short-term**: Test with real users/devices
3. **Medium-term**: Consider custom domain (paid ngrok)
4. **Long-term**: Deploy to production server

---

**Your app is now ready to go public! 🚀**

For detailed error solutions, see: `NGROK_PUBLIC_SETUP_GUIDE.md` - Step 10
