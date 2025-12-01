# Tekton Website - ngrok Hosting Setup Guide

## Overview

**ngrok** is a tool that exposes your local server to the internet via a secure tunnel. Perfect for:
- Testing your application publicly
- Sharing with team members
- Webhook testing
- Quick deployment for demos

### What You'll Get
```
Your Local Development
    ↓
http://localhost:3000 (Frontend)
http://localhost:5000 (Backend)
    ↓
    ngrok tunnels
    ↓
https://abc123def456.ngrok.io (Public Frontend)
https://api-abc123def456.ngrok.io (Public Backend)
```

---

## Table of Contents

1. [Install ngrok](#install-ngrok)
2. [Create ngrok Account](#create-ngrok-account)
3. [Configure ngrok](#configure-ngrok)
4. [Start Tekton Website Locally](#start-tekton-website-locally)
5. [Create ngrok Tunnels](#create-ngrok-tunnels)
6. [Update Frontend API URLs](#update-frontend-api-urls)
7. [Testing](#testing)
8. [Advanced Configuration](#advanced-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Step 1: Install ngrok

### Option A: Download from ngrok.com (Windows)

1. Go to [ngrok.com/download](https://ngrok.com/download)
2. Download **Windows (64-bit)** ZIP file
3. Extract to a folder (e.g., `C:\ngrok`)
4. Add to PATH (optional, for global access)

### Option B: Install via Chocolatey (Windows)

```powershell
# As Administrator
choco install ngrok

# Verify installation
ngrok --version
```

### Option C: Install via npm (All Platforms)

```bash
npm install -g ngrok
```

**Verify Installation:**

```powershell
ngrok --version

# Should show: ngrok version 3.x.x
```

---

## Step 2: Create ngrok Account & Get Auth Token

### 2.1 Sign Up

1. Go to [ngrok.com](https://ngrok.com)
2. Click **Sign Up** (top right)
3. Create account with email or GitHub
4. Verify email

### 2.2 Get Auth Token

1. Login to [dashboard.ngrok.com](https://dashboard.ngrok.com)
2. Left sidebar → **Auth** → **Your Authtoken**
3. Copy the token (looks like: `1jdkfj_23jkjdsf_ajskf23423...`)

### 2.3 Add Auth Token to ngrok

**On Windows (PowerShell as Administrator):**

```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE

# Example:
ngrok config add-authtoken 1jdkfj_23jkjdsf_ajskf23423
```

**Verify:**

```powershell
ngrok config list
# Should show your auth token
```

---

## Step 3: Configure ngrok

### 3.1 Create ngrok Configuration File

**File: `C:\Users\YourUsername\.ngrok2\ngrok.yml`** (auto-created above)

Or create custom config for Tekton:

**File: `C:\ngrok-config.yml`**

```yaml
# ngrok configuration for Tekton Website
authtoken: YOUR_AUTH_TOKEN

# Tunnels for frontend and backend
tunnels:
  frontend:
    proto: http
    addr: 3000
    subdomain: tekton-frontend
    
  backend:
    proto: http
    addr: 5000
    subdomain: tekton-backend
```

**To use this config:**

```powershell
ngrok start --config C:\ngrok-config.yml --all
```

### 3.2 Setup Reserved Domains (Optional)

For consistent URLs, use ngrok Pro:

1. Go to [dashboard.ngrok.com](https://dashboard.ngrok.com) → **Cloud Edge** → **Domains**
2. Click **Create Domain**
3. Enter domain like: `tekton-frontend.ngrok.io`
4. Add to config:

```yaml
tunnels:
  frontend:
    proto: http
    addr: 3000
    domain: tekton-frontend.ngrok.io
```

---

## Step 4: Start Tekton Website Locally

### 4.1 Terminal 1 - Backend Server

```bash
cd C:\Users\ASUS OLED\TektonWebsite\backend

# Install dependencies if needed
npm install

# Start backend
npm start

# Or with nodemon for auto-reload
npm run dev

# Should show: Server running on http://localhost:5000
```

### 4.2 Terminal 2 - Frontend Development Server

```bash
cd C:\Users\ASUS OLED\TektonWebsite

# Install dependencies if needed
npm install

# Start frontend
npm run dev

# Should show: http://localhost:5173 or http://localhost:3000
```

**Keep both terminals open and running!**

---

## Step 5: Create ngrok Tunnels

### 5.1 Simple Tunnel (One at a time)

**Terminal 3 - Backend ngrok:**

```powershell
ngrok http 5000

# Output shows:
# Forwarding: https://abc123def456.ngrok.io -> http://localhost:5000
# Web Interface: http://127.0.0.1:4040
```

**Terminal 4 - Frontend ngrok:**

```powershell
ngrok http 3000

# Output shows:
# Forwarding: https://xyz789abc123.ngrok.io -> http://localhost:3000
# Web Interface: http://127.0.0.1:4041
```

**Copy these URLs! You'll need them for configuration.**

### 5.2 Multiple Tunnels (Recommended)

Create all tunnels in one terminal:

**Terminal 3 - All ngrok tunnels:**

```powershell
# Option 1: Using config file
ngrok start --config C:\ngrok-config.yml --all

# Option 2: Start them all manually
ngrok start frontend backend

# Option 3: Multiple commands in one terminal
ngrok http --label="Frontend" 3000 & ngrok http --label="Backend" 5000
```

**Note:** Multiple tunnels on free tier may have bandwidth limits.

### 5.3 Monitor ngrok Traffic

Open ngrok web interface:

```
http://127.0.0.1:4040
```

Shows all requests, responses, and network details.

---

## Step 6: Update Frontend API URLs

### 6.1 Create Environment File

**File: `.env.production.local`** (in project root)

```env
VITE_API_URL=https://YOUR_BACKEND_NGROK_URL
VITE_APP_NAME=Tekton Website
```

**Example:**

```env
VITE_API_URL=https://abc123def456.ngrok.io
```

### 6.2 Update API Client

**File: `src/utils/apiClient.js`**

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
```

### 6.3 Update CORS on Backend

**File: `backend/middleware/securityConfig.js`**

```javascript
const cors = require('cors');

const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://localhost:5173",
  
  // ngrok tunnels
  "https://YOUR_FRONTEND_NGROK_URL",
  "https://YOUR_BACKEND_NGROK_URL",
  
  // Examples:
  // "https://xyz789abc123.ngrok.io",
  // "https://abc123def456.ngrok.io",
];

module.exports = cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### 6.4 Update Other Services

**File: `src/components/YourComponent.jsx`**

Replace hardcoded URLs:

```javascript
// ❌ OLD
const API_URL = "http://localhost:5000/api/markers";

// ✅ NEW
const API_URL = `${import.meta.env.VITE_API_URL}/api/markers`;
```

---

## Step 7: Testing Your ngrok Setup

### 7.1 Test Frontend Access

1. Open browser
2. Visit: `https://YOUR_FRONTEND_NGROK_URL`
3. Should see Tekton login page

**If blank/error:**
- Check frontend is running on localhost:3000
- Check ngrok forwarding terminal
- Check ngrok web interface (http://127.0.0.1:4040)

### 7.2 Test Backend API

**In PowerShell/Terminal:**

```powershell
# Test backend endpoint
curl https://YOUR_BACKEND_NGROK_URL/api/events -v

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/json
# [data...]
```

### 7.3 Test API Integration

1. **Open browser at frontend URL**
2. **Go to browser DevTools (F12)**
3. **Switch to Network tab**
4. **Try signup/login**
5. **Check API calls:**
   - All requests should go to `https://YOUR_BACKEND_NGROK_URL`
   - Status should be 200 OK
   - No CORS errors

### 7.4 Test Full Feature Flow

**Signup:**
- Fill form and submit
- Should see success message
- Check API call in Network tab

**Login:**
- Use created account
- Should redirect to dashboard
- Token should be stored in localStorage

**Upload (Analytics):**
- Upload a JSON file
- Should see success toast
- Marker should appear on map

---

## Step 8: Advanced Configuration

### 8.1 Custom Domains (ngrok Pro)

```yaml
tunnels:
  frontend:
    proto: http
    addr: 3000
    domain: tekton-app.ngrok.io
    
  backend:
    proto: http
    addr: 5000
    domain: tekton-api.ngrok.io
```

### 8.2 Offline Header

Allow access without internet:

```powershell
ngrok http 3000 --offline
```

### 8.3 Request Inspection

```powershell
# Start with detailed logging
ngrok http 3000 --log stdout

# Or inspect via web UI
# http://127.0.0.1:4040/inspect/http
```

### 8.4 Basic Authentication

Protect your tunnel:

```powershell
ngrok http 3000 --basic-auth "user:password"

# URL becomes:
# https://user:password@abc123.ngrok.io
```

### 8.5 Webhook for Live Updates

Configure ngrok webhook:

1. Go to [dashboard.ngrok.com](https://dashboard.ngrok.com) → **Cloud Edge** → **Event Subscriptions**
2. Create subscription for tunnel events
3. Get notified when tunnel starts/stops

---

## Step 9: Sharing Your Application

### 9.1 Share Frontend URL

Send to team members:

```
https://YOUR_FRONTEND_NGROK_URL

Username: test@domain.com
Password: YourPassword123
```

### 9.2 Share API Documentation

Create API docs at:

```
https://YOUR_BACKEND_NGROK_URL/api-docs
```

(If you have Swagger/OpenAPI setup)

### 9.3 Webhook Testing

If you need to test webhooks:

```powershell
# Start ngrok tunnel
ngrok http 3000

# Send webhook to:
https://YOUR_FRONTEND_NGROK_URL/webhook/events
```

---

## Step 10: Troubleshooting

### Issue: "Tunnel already in use"

**Solution:**

```powershell
# Kill existing ngrok process
Get-Process ngrok | Stop-Process -Force

# Or find what's using the port
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Start fresh
ngrok http 5000
```

### Issue: CORS Errors

**Solution:**

1. Copy your ngrok frontend URL
2. Add to backend CORS:

```javascript
const allowedOrigins = [
  "https://xyz789abc123.ngrok.io",  // Your frontend ngrok URL
  "https://abc123def456.ngrok.io",  // Your backend ngrok URL
];
```

3. Restart backend
4. Try again

### Issue: "Invalid token"

**Solution:**

```powershell
# Re-authenticate
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Verify
ngrok config list

# Test
ngrok http 3000
```

### Issue: Frontend shows "Cannot GET /"

**Solution:**

```bash
# Rebuild frontend
cd C:\Users\ASUS OLED\TektonWebsite
npm run build

# Or ensure dev server is running
npm run dev
```

### Issue: API calls timeout

**Solution:**

```javascript
// Increase timeout in apiClient.js
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // Increased from 10000
});
```

### Issue: ngrok says "Tunnel temporarily unavailable"

**Solution:**

1. Check your ngrok account status (not expired)
2. Check internet connection
3. Restart ngrok: `ngrok http 5000`
4. Check available tunnels: `ngrok config list`

---

## Complete Startup Checklist

### Terminal 1 - Backend

```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### Terminal 2 - Frontend

```bash
cd ..
npm run dev
# Running on http://localhost:3000 or http://localhost:5173
```

### Terminal 3 - ngrok Backend

```powershell
ngrok http 5000
# Copy: https://abc123def456.ngrok.io
```

### Terminal 4 - ngrok Frontend

```powershell
ngrok http 3000
# Copy: https://xyz789abc123.ngrok.io
```

### Browser

1. Update `.env.production.local` with backend URL
2. Restart frontend dev server
3. Visit frontend ngrok URL
4. Test signup/login/features

---

## Monitoring & Analytics

### Real-time Traffic

```
http://127.0.0.1:4040
```

Shows:
- All requests/responses
- Headers and body
- Replay requests
- Performance metrics

### Logs

```powershell
# View ngrok logs
Get-Content $env:APPDATA\.ngrok2\ngrok.log -Tail 50

# Or stream logs
ngrok http 3000 --log stdout
```

### Session Details

Each ngrok tunnel shows:
- Public URL
- Forwarding address
- Connection count
- Traffic status

---

## Tips & Best Practices

✅ **DO:**
- Keep ngrok running while testing
- Update CORS for your ngrok URLs
- Use environment variables for API URLs
- Monitor traffic via web interface
- Test all features before sharing

❌ **DON'T:**
- Share ngrok URLs long-term (they change on restart)
- Hardcode ngrok URLs in code
- Run ngrok on public networks without auth
- Use free tier for production
- Leave ngrok tunnel exposed with sensitive data

---

## Next Steps

1. ✅ Install ngrok
2. ✅ Create account and get auth token
3. ✅ Start local servers
4. ✅ Create tunnels
5. ✅ Update API URLs
6. ✅ Test end-to-end
7. ✅ Share with team
8. ✅ Monitor with web UI

---

## Command Reference

```powershell
# Basic usage
ngrok http 5000
ngrok http 3000

# Multiple tunnels
ngrok start --config ngrok-config.yml --all

# View auth token
ngrok config list

# Update auth token
ngrok config add-authtoken YOUR_TOKEN

# Help
ngrok http --help

# Kill ngrok process
Get-Process ngrok | Stop-Process

# View logs
Get-Content $env:APPDATA\.ngrok2\ngrok.log -Tail 50
```

---

## Documentation & Support

- **Official Docs:** [ngrok.com/docs](https://ngrok.com/docs)
- **Dashboard:** [dashboard.ngrok.com](https://dashboard.ngrok.com)
- **Community:** [ngrok GitHub Discussions](https://github.com/ngrok/ngrok-go/discussions)
- **API Reference:** [ngrok.com/docs/api](https://ngrok.com/docs/api)

---

**Your Tekton Website is now publicly accessible! 🚀**

For quick reference, save the ngrok URLs:

```
Frontend:  https://_________________.ngrok.io
Backend:   https://_________________.ngrok.io
Auth Token: _________________________
```

---

## Alternative: Using ngrok CLI in Your Project

### Create npm script for ngrok

**File: `package.json`** (in root)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd . && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "ngrok": "ngrok start --config ngrok-config.yml --all",
    "start:all": "concurrently \"npm run dev\" \"npm run ngrok\""
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

**Then simply:**

```bash
npm run start:all
```

Starts everything in one command!
