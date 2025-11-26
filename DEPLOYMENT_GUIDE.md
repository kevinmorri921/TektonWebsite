# Tekton Website System - Deployment Guide

## Overview
This guide walks you through deploying your full-stack Tekton Website system (React frontend + Express backend + MongoDB) to web hosting.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, ensure you have:

### Required Accounts
- [ ] **Web Hosting Account** (Heroku, Railway, Render, or similar for backend)
- [ ] **MongoDB Atlas Account** (for cloud database)
- [ ] **Static Hosting Account** (Vercel, Netlify for frontend)
- [ ] **Git Repository** (GitHub account)

### Required Tools Installed Locally
```bash
# Node.js and npm
node --version  # Should be v16+ 
npm --version

# Git
git --version

# Heroku CLI (if using Heroku)
heroku --version
```

### Project Files Ready
- [ ] Entire `/backend` folder with `package.json`
- [ ] Entire `/src` folder (React frontend)
- [ ] Root `package.json` and `vite.config.js`
- [ ] All configuration files (`.env`, etc.)

---

## Step 1: Prepare Your Project for Deployment

### 1.1 Create .gitignore File
Create a `.gitignore` file in your root directory:
```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
*.log
.DS_Store
/backend/uploads/
/backend/logs/
```

### 1.2 Update package.json Scripts
**Root `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "cd backend && npm start"
  }
}
```

**Backend `package.json`:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 1.3 Create Environment Configuration Files

**Root `.env` (local development only - never commit):**
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Tekton Website
```

**Backend `.env` (local development only - never commit):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tekton
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRY=7d
UPLOAD_DIR=./uploads
LOG_DIR=./logs
```

---

## Step 2: Set Up MongoDB Atlas (Cloud Database)

### 2.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up and verify email
3. Create a free cluster (M0)

### 2.2 Configure Database Access
1. Go to **Database Access** → **Add New Database User**
   - Username: `tekton_user`
   - Password: Generate a strong password
   - Built-in Role: `Atlas Admin`

2. Go to **Network Access** → **Add IP Address**
   - Add `0.0.0.0/0` (allow all - for development)
   - Or add specific IP addresses (recommended for production)

### 2.3 Get Connection String
1. Go to **Clusters** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://tekton_user:PASSWORD@cluster.mongodb.net/tekton?retryWrites=true&w=majority
   ```
4. Replace `PASSWORD` with your actual password

---

## Step 3: Deploy Backend to Cloud Hosting

### Option A: Deploy to Heroku (Recommended for Beginners)

#### 3A.1 Install Heroku CLI
```bash
# Windows
choco install heroku-cli

# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 3A.2 Login to Heroku
```bash
heroku login
```

#### 3A.3 Create Heroku App
```bash
cd c:\Users\ASUS OLED\TektonWebsite\backend

# Create new Heroku app
heroku create tekton-api

# Check if app was created
heroku apps
```

#### 3A.4 Set Environment Variables on Heroku
```bash
heroku config:set NODE_ENV=production --app tekton-api
heroku config:set MONGODB_URI="mongodb+srv://tekton_user:PASSWORD@cluster.mongodb.net/tekton?retryWrites=true&w=majority" --app tekton-api
heroku config:set JWT_SECRET="your_very_secret_key_min_32_chars" --app tekton-api
heroku config:set JWT_EXPIRY=7d --app tekton-api
heroku config:set PORT=5000 --app tekton-api
```

#### 3A.5 Deploy Backend
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial backend commit"

# Add Heroku remote
heroku git:remote --app tekton-api

# Deploy
git push heroku main
```

#### 3A.6 Verify Deployment
```bash
# Check logs
heroku logs --tail --app tekton-api

# Test the API
curl https://tekton-api.herokuapp.com/api/events
```

---

### Option B: Deploy to Railway

#### 3B.1 Setup Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

#### 3B.2 Connect GitHub Repository
1. Click **New Project** → **Deploy from GitHub**
2. Select your `TektonWebsite` repository
3. Select `/backend` as root directory

#### 3B.3 Configure Environment Variables
1. Go to **Variables** tab
2. Add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your Atlas connection string
   - `JWT_SECRET`: Your secret key
   - `JWT_EXPIRY`: `7d`
   - `PORT`: `5000`

#### 3B.4 Deploy
- Railway auto-deploys on GitHub push
- View logs in Railway dashboard

---

### Option C: Deploy to Render

#### 3C.1 Setup Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### 3C.2 Create Web Service
1. Click **New +** → **Web Service**
2. Connect GitHub repository
3. Select `TektonWebsite` repo
4. Set root directory: `/backend`

#### 3C.3 Configure Service
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

#### 3C.4 Add Environment Variables
1. Go to **Environment** tab
2. Add all required variables (same as Railway/Heroku)

---

## Step 4: Deploy Frontend to Cloud Hosting

### Option A: Deploy to Vercel (Recommended)

#### 4A.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

#### 4A.2 Import Project
1. Click **New Project**
2. Select your `TektonWebsite` GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 4A.3 Set Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://tekton-api.herokuapp.com
   VITE_APP_NAME=Tekton Website
   ```

#### 4A.4 Deploy
- Vercel auto-deploys on GitHub push
- Check deployment status in dashboard

---

### Option B: Deploy to Netlify

#### 4B.1 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub

#### 4B.2 Connect GitHub Repository
1. Click **Add new site** → **Import an existing project**
2. Select your `TektonWebsite` repository

#### 4B.3 Configure Build Settings
- **Base directory**: Leave empty
- **Build command**: `npm run build`
- **Publish directory**: `dist`

#### 4B.4 Set Environment Variables
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add:
   ```
   VITE_API_URL=https://tekton-api.herokuapp.com
   ```

#### 4B.5 Deploy
- Click **Deploy site**
- Netlify builds and deploys automatically

---

## Step 5: Update API URLs in Frontend

### 5.1 Update API Endpoints
After deployment, update all API URLs in your frontend:

**File: `src/Dashboard/Dashboard.jsx`**
Replace all instances of:
```javascript
http://localhost:5000
```
With your production backend URL:
```javascript
https://tekton-api.herokuapp.com
```

**File: `src/Analytics/Analytics.jsx`**
Same replacement for all API calls.

### 5.2 Use Environment Variables (Best Practice)
Create `.env.production`:
```
VITE_API_URL=https://tekton-api.herokuapp.com
```

Then update your code to use:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Use in API calls
axios.get(`${API_URL}/api/events`)
```

---

## Step 6: Configure CORS on Backend

### 6.1 Update Backend CORS Settings
**File: `backend/middleware/securityConfig.js`**
```javascript
const allowedOrigins = [
  "http://localhost:5173",           // Local development
  "http://localhost:3000",           // Fallback local
  "https://tekton-website.vercel.app", // Your Vercel frontend URL
  "https://your-netlify-site.netlify.app" // Your Netlify URL
];

const cors = require('cors');

module.exports = cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### 6.2 Deploy Backend Changes
```bash
cd backend
git add .
git commit -m "Update CORS for production"
git push heroku main  # Or git push for Vercel/Netlify/Railway
```

---

## Step 7: Database Migrations (If Needed)

### 7.1 Run Initial Setup
```bash
# Connect to your backend production instance
# For Heroku:
heroku run node backend/scripts/createSuperAdmin.js --app tekton-api

# This will create initial admin user
```

### 7.2 Verify Database Connection
```bash
# Check MongoDB Atlas
# Go to mongodb.com/cloud/atlas
# Click your cluster → Collections
# Verify tables exist: users, events, markers, surveys, etc.
```

---

## Step 8: Verification & Testing

### 8.1 Test Backend API
```bash
# Test health endpoint
curl https://tekton-api.herokuapp.com/api/events

# Should return an array or data
```

### 8.2 Test Frontend Access
1. Visit your Vercel/Netlify URL
2. Try logging in with test credentials
3. Create an event
4. Upload a survey
5. Verify data appears in database

### 8.3 Check Browser Console
1. Open browser DevTools (F12)
2. Check **Network** tab for API calls
3. Verify no CORS errors
4. Check **Console** for JavaScript errors

### 8.4 Monitor Logs
```bash
# Heroku
heroku logs --tail --app tekton-api

# Railway/Render - Check dashboard logs
```

---

## Step 9: Production Checklist

- [ ] MongoDB Atlas cluster created and secured
- [ ] Backend deployed to Heroku/Railway/Render
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Environment variables set on all services
- [ ] CORS configured correctly
- [ ] API URL updated in frontend
- [ ] SSL/HTTPS enabled (automatic on most platforms)
- [ ] Database backup enabled (MongoDB Atlas)
- [ ] Email notifications working (if applicable)
- [ ] File uploads working
- [ ] User authentication working
- [ ] Admin panel accessible

---

## Step 10: Post-Deployment Setup

### 10.1 Create Super Admin User
```bash
# SSH into your backend or run script
# For Heroku:
heroku run node backend/scripts/createSuperAdmin.js --app tekton-api

# Follow prompts to create admin user
```

### 10.2 Configure Email (Optional)
If you want email notifications:
1. Sign up for SendGrid or similar service
2. Add email credentials to backend environment variables
3. Update `backend/server.js` to use email service

### 10.3 Setup Monitoring
- Enable error tracking (Sentry)
- Setup uptime monitoring (Pingdom)
- Enable database backups (MongoDB Atlas auto-backup)

---

## Troubleshooting

### Issue: "Cannot GET /api/events"
**Solution**: Backend not deployed or API URL incorrect
- Verify backend deployment: `https://your-backend-url.herokuapp.com/api/events`
- Check CORS configuration
- Verify MongoDB connection string

### Issue: CORS Error in Browser
**Solution**: Frontend and backend URLs mismatch
- Check `allowedOrigins` in backend
- Verify frontend environment variables
- Clear browser cache

### Issue: Database Connection Failed
**Solution**: MongoDB Atlas configuration issue
- Verify connection string in environment variables
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0)
- Test connection locally first

### Issue: File Upload Not Working
**Solution**: Upload directory not configured on server
- Heroku/Railway use ephemeral storage - use cloud storage (AWS S3, Cloudinary)
- Or update to save uploads to database

### Issue: Images Not Loading
**Solution**: File path issues
- Update image URLs to use production paths
- Verify `public` folder is deployed
- Check file permissions

---

## Important Security Notes

⚠️ **NEVER commit `.env` files to Git**

⚠️ **Always use strong JWT_SECRET** (minimum 32 characters)

⚠️ **Enable HTTPS** (automatic on most platforms)

⚠️ **Restrict CORS** to only your domains

⚠️ **Enable rate limiting** on production:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

---

## Quick Reference URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend | https://tekton-website.vercel.app |
| Backend API | https://tekton-api.herokuapp.com |
| MongoDB Atlas | https://mongodb.com/cloud/atlas |
| Vercel Dashboard | https://vercel.com/dashboard |
| Heroku Dashboard | https://dashboard.heroku.com |

---

## Additional Resources

- [Heroku Documentation](https://devcenter.heroku.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## Support & Next Steps

After deployment:
1. Monitor logs daily for errors
2. Set up automated backups
3. Plan maintenance windows
4. Test disaster recovery procedures
5. Update documentation with production URLs

For questions, refer to platform-specific documentation or contact hosting support.
