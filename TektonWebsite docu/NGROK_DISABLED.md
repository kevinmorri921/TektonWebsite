# ngrok Configuration - Currently Disabled

## Status: LOCALHOST ONLY (ngrok commented out)

Your Tekton Website is currently configured to use **localhost** exclusively.

---

## To Re-enable ngrok Later:

### Step 1: Uncomment apiClient.js

**File: `src/utils/apiClient.js`**

```javascript
// Change from:
const getAPIBaseURL = () => {
  return 'http://localhost:5000';
  
  // 🔶 COMMENTED: ngrok alternative
  // if (import.meta.env.VITE_API_URL) { ...
};

// To:
const getAPIBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:5000';
};
```

### Step 2: Update backend/.env

```env
# Add ngrok URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-ngrok-url.ngrok.io
```

### Step 3: Update Frontend .env

```env
# Create .env or .env.local (frontend)
VITE_API_URL=https://your-ngrok-url.ngrok.io
```

### Step 4: Start ngrok Tunnels

```powershell
# Terminal 3
ngrok http 5000

# Terminal 4  
ngrok http 5173
```

---

## Current Configuration

```
Frontend: http://localhost:5173 ✓
Backend:  http://localhost:5000 ✓
ngrok:    DISABLED (commented out) 🔶
```

---

## ngrok Documentation

All ngrok documentation is preserved in your project:
- `NGROK_SETUP_GUIDE.md` - Complete setup guide
- `NGROK_QUICK_START.md` - 5-minute quick start
- `NGROK_SETUP_COMPLETE.md` - Setup summary
- `NGROK_REFERENCE.md` - Command reference
- `NGROK_ARCHITECTURE.md` - System architecture diagrams
- `NGROK_MASTER_INDEX.md` - File index and navigation
- `NGROK_VISUAL_SUMMARY.md` - Visual quick reference

Plus scripts:
- `start-public.ps1` - Automated ngrok setup
- `setup-ngrok-urls.ps1` - Interactive configuration
- `ngrok-tunnel-manager.ps1` - Manual tunnel control

---

## Status Summary

| Component | Localhost | ngrok |
|-----------|-----------|-------|
| Enabled | ✅ YES | 🔶 NO |
| Frontend URL | http://localhost:5173 | (commented) |
| Backend URL | http://localhost:5000 | (commented) |
| Configuration | Active | Disabled |
| To Enable | No changes needed | See steps above |

---

**To use localhost (default):** No action needed - everything works!

**To use ngrok:** Follow re-enable steps above.
