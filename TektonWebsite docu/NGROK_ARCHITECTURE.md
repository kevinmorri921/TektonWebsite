# 🏗️ TektonWebsite + ngrok - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET (Public)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐          ┌──────────────────────┐       │
│  │  Your Phone/Tablet   │          │  Other User Device   │       │
│  │  (External)          │          │  (External)          │       │
│  └──────────────┬───────┘          └──────────────┬───────┘       │
│                 │                                 │                │
│                 └─────────────────┬────────────────┘                │
│                                   │                                │
│                          HTTPS (Public URLs)                       │
│                                   │                                │
├───────────────────────────────────┼────────────────────────────────┤
│                                   │                                │
│                         🌐 ngrok Service                           │
│              (Tunneling + Domain forwarding)                       │
│                                   │                                │
├───────────────────────────────────┼────────────────────────────────┤
│                                   │                                │
│              Your Computer (PC/Laptop)                             │
│              ┌────────────────────┴──────────────────┐             │
│              │                                       │             │
│              ▼                                       ▼             │
│    ┌──────────────────────┐          ┌──────────────────────┐    │
│    │  ngrok Tunnel #1     │          │  ngrok Tunnel #2     │    │
│    │  (Backend Proxy)     │          │  (Frontend Proxy)    │    │
│    │  Port 5000 ◄──────►  │          │  Port 5173 ◄──────►  │    │
│    └──────────┬───────────┘          └──────────┬───────────┘    │
│               │                                 │                 │
│               ▼                                 ▼                 │
│    ┌──────────────────────┐          ┌──────────────────────┐    │
│    │   Backend Server     │          │  Frontend Server     │    │
│    │ Node.js + Express    │          │  Vite + React        │    │
│    │  http://localhost:5000│          │  http://localhost:5173│   │
│    └──────────┬───────────┘          └──────────┬───────────┘    │
│               │                                 │                 │
│               └─────────────────┬────────────────┘                │
│                                 │                                 │
│                                 ▼                                 │
│                    ┌────────────────────────┐                     │
│                    │   MongoDB Atlas        │                     │
│                    │   (Cloud Database)     │                     │
│                    │   TLS/SSL Encrypted    │                     │
│                    └────────────────────────┘                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Network Flow Diagram

```
SCENARIO: User visits your public frontend URL on their phone

1️⃣ Phone Request
   ┌─────────────────────────────────────────────┐
   │ User Types: https://abc123-xyz.ngrok.io     │
   │             (Frontend Public URL)           │
   └─────────────────────────────────────────────┘
                         │
                         ▼
2️⃣ Internet Routing
   ┌─────────────────────────────────────────────┐
   │ Request goes through ngrok infrastructure   │
   │ (ngrok's global servers route to your PC)   │
   └─────────────────────────────────────────────┘
                         │
                         ▼
3️⃣ ngrok Tunnel
   ┌─────────────────────────────────────────────┐
   │ ngrok tunnel receives request                │
   │ Forwards to: localhost:5173 (your PC)       │
   └─────────────────────────────────────────────┘
                         │
                         ▼
4️⃣ Frontend Response
   ┌─────────────────────────────────────────────┐
   │ React app loads in user's browser            │
   │ HTML + CSS + JS delivered                    │
   └─────────────────────────────────────────────┘
                         │
                         ▼
5️⃣ API Call from Frontend
   ┌─────────────────────────────────────────────┐
   │ Browser XHR: GET /api/user                   │
   │ To: https://def456-uvw.ngrok.io (Backend)   │
   └─────────────────────────────────────────────┘
                         │
                         ▼
6️⃣ Backend Processing
   ┌─────────────────────────────────────────────┐
   │ Express server receives API request          │
   │ Verifies JWT token                           │
   │ Validates CORS origin                        │
   └─────────────────────────────────────────────┘
                         │
                         ▼
7️⃣ Database Query
   ┌─────────────────────────────────────────────┐
   │ Query MongoDB Atlas (Cloud)                  │
   │ Connection: TLS/SSL Encrypted                │
   │ Authentication: MongoDB credentials          │
   └─────────────────────────────────────────────┘
                         │
                         ▼
8️⃣ Response Back
   ┌─────────────────────────────────────────────┐
   │ JSON data sent back through:                │
   │ DB ➜ Backend ➜ ngrok ➜ Internet ➜ Browser  │
   └─────────────────────────────────────────────┘
```

---

## Data Flow with CORS & Security

```
Frontend Request
       │
       ▼
┌──────────────────────────┐
│ HTTP Headers:            │
│ Origin: https://abc.ngrok.io │
│ Accept: application/json │
│ Authorization: Bearer [JWT] │
└──────────────────────────┘
       │
       ▼
       🌐 ngrok Tunnel
       │
       ▼
┌──────────────────────────┐
│ Backend (Express)        │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ CORS Middleware          │
│ (middleware/securityConfig.js)│
│                          │
│ Check ALLOWED_ORIGINS:   │
│ ✓ localhost:5173        │
│ ✓ localhost:3000        │
│ ✓ abc123.ngrok.io      │
│ ✓ def456.ngrok.io      │
│                          │
│ Allow? YES ✓             │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Auth Middleware          │
│ (middleware/auth.js)     │
│                          │
│ Verify JWT Token:        │
│ ✓ Check signature        │
│ ✓ Check expiration       │
│ ✓ Fetch user from DB     │
│ ✓ Check if enabled       │
│                          │
│ Valid? YES ✓             │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Route Handler            │
│ (routes/user-profile.js) │
│                          │
│ Execute business logic   │
│ Query database           │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ MongoDB Atlas            │
│                          │
│ Query: db.users.findOne │
│ TLS/SSL: Encrypted ✓    │
│ Auth: Credentials ✓     │
└──────────────────────────┘
       │
       ▼
Response (JSON)
Returns through same path:
DB ➜ Route ➜ Backend ➜ ngrok ➜ Frontend ➜ Browser

CORS Headers Applied:
Access-Control-Allow-Origin: https://abc123.ngrok.io
Access-Control-Allow-Credentials: true
```

---

## Tunnel Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR LOCAL COMPUTER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐                   │
│  │  Port 5000     │  │  Port 5173     │                   │
│  │  Backend       │  │  Frontend      │                   │
│  │  Express       │  │  Vite/React    │                   │
│  └────────┬───────┘  └────────┬───────┘                   │
│           │                   │                           │
│  ┌────────▼───────────────────▼───────┐                   │
│  │      ngrok Client Process          │                   │
│  │  (Installed from ngrok.com)        │                   │
│  └────────┬───────────────────────────┘                   │
│           │                                               │
│           │ Encrypted Connection                         │
│           │ (TLS/SSL)                                    │
│           ▼                                               │
├─────────────────────────────────────────────────────────────┤
│                    INTERNET / ngrok Servers               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────┐                 │
│  │  ngrok Global Tunnel Endpoint         │                 │
│  │  (Routes & forwards traffic)          │                 │
│  └──────────────────────────────────────┘                 │
│           │                   │                           │
│  ┌────────▼──┐      ┌─────────▼────┐                     │
│  │  URL 1:   │      │  URL 2:      │                     │
│  │  https:// │      │  https://    │                     │
│  │  abc123.  │      │  def456.     │                     │
│  │  ngrok.io │      │  ngrok.io    │                     │
│  └───────────┘      └──────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           │                   │
           │ HTTPS            │ HTTPS
           │ Public URLs      │ Public URLs
           ▼                   ▼
    ┌──────────────┐  ┌──────────────┐
    │ Other Users  │  │ Other Users  │
    │ & Devices    │  │ & Devices    │
    └──────────────┘  └──────────────┘
```

---

## Configuration Architecture

```
File Structure & Dependencies
─────────────────────────────

Frontend
  ├── src/
  │   ├── main.jsx (App entry)
  │   ├── api/
  │   │   └── client.js
  │   │       ├── Uses: VITE_API_URL ◄────┐
  │   │       └── Makes requests to Backend│
  │   └── components/
  │       └── Uses API client to fetch data
  │
  └── .env ◄──────────────┐
      VITE_API_URL=https://backend-ngrok.io
      VITE_APP_URL=https://frontend-ngrok.io
      (Both URLs loaded at build time)

Backend
  ├── server.js
  │   ├── Uses: .env variables
  │   └── middleware/securityConfig.js
  │       ├── Reads: ALLOWED_ORIGINS
  │       ├── Uses: CORS validation
  │       └── Returns: CORS headers
  │
  └── .env ◄───────────────┐
      PORT=5000
      ALLOWED_ORIGINS=http://localhost:5173,https://frontend-ngrok.io
      MONGO_URI=mongodb+srv://...
      JWT_SECRET=secret123
      (Loaded at startup via dotenv)

Database
  └── MongoDB Atlas (Remote)
      ├── Connection String (in .env)
      ├── Encryption: TLS/SSL (built-in)
      ├── Authentication: Username/Password
      └── IP Whitelist: (if configured)
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────┐
│           LAYER 1: Transport Security                   │
├──────────────────────────────────────────────────────────┤
│ • ngrok tunnels use HTTPS (SSL/TLS)                     │
│ • All traffic encrypted in transit                      │
│ • Certificates managed by ngrok                        │
│ • HSTS headers added (security)                        │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│          LAYER 2: Origin Validation (CORS)              │
├──────────────────────────────────────────────────────────┤
│ • Frontend requests checked against ALLOWED_ORIGINS     │
│ • middleware/securityConfig.js enforces rules           │
│ • Only whitelisted origins can make requests            │
│ • Prevents unauthorized API access                      │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       LAYER 3: Authentication (JWT Tokens)              │
├──────────────────────────────────────────────────────────┤
│ • User login creates JWT token                          │
│ • Token sent in Authorization header                    │
│ • middleware/auth.js verifies token signature           │
│ • Token expiration checked                              │
│ • Only valid tokens access protected routes             │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       LAYER 4: Database Security                        │
├──────────────────────────────────────────────────────────┤
│ • MongoDB Atlas uses TLS/SSL encryption                 │
│ • Credentials in environment variables                  │
│ • Connection string: mongodb+srv://user:pass@cluster   │
│ • IP whitelist (if configured)                          │
│ • No direct database access from frontend               │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       LAYER 5: Data Validation                          │
├──────────────────────────────────────────────────────────┤
│ • Input validation on all API endpoints                 │
│ • SQL/NoSQL injection prevention                        │
│ • middleware/dataIntegrity.js enforces checks           │
│ • Request size limits                                   │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│       LAYER 6: Error Handling                           │
├──────────────────────────────────────────────────────────┤
│ • Sensitive errors not exposed to client                │
│ • Generic error messages to users                       │
│ • Detailed logs server-side only                        │
│ • middleware/securityConfig.js handles errors           │
│ Status: ✅ ACTIVE                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle with ngrok

```
Step 1: User types URL in browser
        └─> https://abc123.ngrok.io/login

Step 2: Browser resolves DNS
        └─> abc123.ngrok.io ➜ ngrok's server IPs

Step 3: TLS Handshake
        └─> Browser ◄──► ngrok server (encrypted)

Step 4: HTTP Request sent
        GET /login HTTP/1.1
        Host: abc123.ngrok.io
        User-Agent: Mozilla/5.0...

Step 5: ngrok Tunnel
        └─> Receives request from ngrok servers
        └─> Forwards to: http://localhost:5173

Step 6: Frontend Server (Vite)
        └─> Receives request
        └─> Returns: HTML + CSS + JS
        └─> Includes: <script src="/api/config">

Step 7: Browser Parses HTML
        └─> Loads CSS
        └─> Runs React app
        └─> React initializes

Step 8: Frontend App Runs
        └─> Reads VITE_API_URL from import.meta.env
        └─> Makes XHR/Fetch request to API

Step 9: API Request (Backend)
        POST /api/login HTTP/1.1
        Host: def456.ngrok.io
        Origin: https://abc123.ngrok.io
        Authorization: Bearer ...

Step 10: ngrok Tunnel (Backend)
         └─> Receives API request
         └─> Forwards to: http://localhost:5000

Step 11: Express Backend
         └─> Receives request at /api/login
         └─> CORS Middleware checks origin ✓
         └─> Validates credentials
         └─> Creates JWT token

Step 12: Response Sent Back
         HTTP/1.1 200 OK
         Access-Control-Allow-Origin: https://abc123.ngrok.io
         Content-Type: application/json
         {"token": "eyJhbGc...", "user": {...}}

Step 13: Browser Receives Response
         └─> Stores JWT in localStorage
         └─> Stores in memory
         └─> Uses for future API calls

Step 14: Subsequent Requests
         └─> Include Authorization: Bearer [token]
         └─> Auth middleware verifies token
         └─> Request processed if valid
```

---

## Environment Variables Configuration Chain

```
LOCAL DEVELOPMENT                  NGROK PUBLIC
─────────────────────             ─────────────────

Backend (.env)
  PORT=5000                        PORT=5000
  NODE_ENV=development            NODE_ENV=development
  ALLOWED_ORIGINS=                ALLOWED_ORIGINS=
    http://localhost:5173           http://localhost:5173,
    http://localhost:3000           https://abc123.ngrok.io
    http://127.0.0.1:5173

Frontend (.env)
  VITE_API_URL=                    VITE_API_URL=
    http://localhost:5000           https://def456.ngrok.io
  VITE_APP_URL=                    VITE_APP_URL=
    http://localhost:5173           https://abc123.ngrok.io

JavaScript Runtime
  ├─ Reads backend/.env
  ├─ Reads frontend/.env / import.meta.env
  ├─ Validates URLs
  └─ Makes API calls to configured URLs
```

---

## Tunnel Lifecycle

```
SESSION TIMELINE
────────────────

00:00 - START
  User runs: ngrok http 5000 --region us
  ├─ ngrok connects to ngrok infrastructure
  ├─ ngrok starts listening on localhost:5000
  ├─ ngrok gets public URL: https://abc123-xyz.ngrok.io
  └─ URL displayed in terminal

00:00-02:00 - ACTIVE (Free tier: 2 hour limit)
  ├─ Users can access your app via public URL
  ├─ ngrok shows requests in dashboard
  ├─ Tunnels are stable
  └─ Everything works normally

02:00+ - TIMEOUT (Free tier)
  ├─ Session expires
  ├─ Public URL becomes inaccessible
  ├─ Users see: "Bad Gateway" or timeout
  └─ Need to restart ngrok

RESTART
  User runs: ngrok http 5000 --region us
  ├─ New session starts
  ├─ NEW public URL issued (different from before!)
  ├─ Must update .env files with new URL
  ├─ Must restart backend server (CORS needs update)
  └─ Cycle repeats

PRO TIP: Upgrade to ngrok Pro
  • Sessions: Unlimited
  • URLs: Static (same every time)
  • No restart needed for config changes
```

---

## Common Issues Map

```
ISSUE DECISION TREE
───────────────────

"Can't access https://abc123.ngrok.io"
├─ Check if ngrok tunnel is running
│  └─ Fix: ngrok http 5173
├─ Check if frontend is running
│  └─ Fix: npm run dev
└─ Check firewall/network
   └─ Fix: Allow ports in firewall

"404 error on API calls"
├─ Check if backend ngrok is running
│  └─ Fix: ngrok http 5000
├─ Check if frontend VITE_API_URL is correct
│  └─ Fix: Update .env with backend URL
├─ Check if URL matches what's in ALLOWED_ORIGINS
│  └─ Fix: Update backend .env and restart
└─ Check browser console for actual error
   └─ Open DevTools > Network tab

"CORS error in browser"
├─ Check if frontend URL in ALLOWED_ORIGINS
│  └─ Fix: Add frontend URL to backend/.env
├─ Check if backend restarted after update
│  └─ Fix: Ctrl+C then npm start
├─ Check if ngrok URLs changed
│  └─ Fix: If yes, update .env files again
└─ Hard refresh browser
   └─ Ctrl+Shift+R (Windows)

"ngrok tunnel not responding"
├─ Check internet connection
├─ Check ngrok authentication
│  └─ Fix: ngrok config check
├─ Check if port is available
│  └─ Fix: netstat -ano | findstr 5000
└─ Restart ngrok tunnel
   └─ Kill process and start fresh
```

---

## Performance Considerations

```
LATENCY FACTORS
───────────────

Network:
  Your PC ──(50-100ms)──► ngrok server ──(20-50ms)──► User
  
  Total latency: 70-150ms additional
  (vs direct connection: 20-50ms)

Throughput:
  Free tier: 40 connections/minute
  Typical page load: 5-20 requests
  Result: Should handle casual use fine
  
  Pro tier: Much higher limits
  Recommended for heavy usage

Optimization:
  1. Use same region as most users
     └─ ngrok http 5000 --region us
  
  2. Minimize API payload
     └─ Use response compression
  
  3. Cache static assets
     └─ Vite handles this automatically
  
  4. Use CDN for large files
     └─ Consider for production
```

---

## Upgrade Path: From ngrok to Production

```
PHASE 1: LOCAL DEVELOPMENT (Current)
┌────────────────────────────────┐
│ localhost:5000 ◄──► localhost:5173
│ Works for one developer
│ Not accessible externally
└────────────────────────────────┘
         │
         ▼

PHASE 2: TESTING WITH ngrok
┌────────────────────────────────┐
│ https://abc123.ngrok.io ◄───► Others
│ Great for testing
│ URL changes frequently
│ Limited to 2 hours (free tier)
└────────────────────────────────┘
         │
         ▼

PHASE 3: STAGING SERVER (Optional)
┌────────────────────────────────┐
│ https://staging.yourdomain.com
│ Dedicated server
│ Stable, predictable URLs
│ Test before production
└────────────────────────────────┘
         │
         ▼

PHASE 4: PRODUCTION DEPLOYMENT
┌────────────────────────────────┐
│ https://yourdomain.com
│ Real domain, SSL certificate
│ Scalable infrastructure
│ Your app available 24/7
│ Professional setup
└────────────────────────────────┘
```

---

**Architecture complete! Your ngrok setup is mapped out.** 🏗️

Next: Review the Quick Start guide or run the setup scripts!
