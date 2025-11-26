# 🎯 Tekton Website - Complete System Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [User Workflows](#user-workflows)
7. [Admin Workflows](#admin-workflows)
8. [Security Features](#security-features)
9. [Event Logging](#event-logging)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)

---

## System Overview

### 🎓 What is Tekton Website?
Tekton Website is a secure, role-based web application for managing geological survey data, markers, and user activity. It provides:
- User authentication with role-based access control
- Marker management (upload/download)
- Survey creation and management
- Comprehensive activity logging
- Admin panel for user and system management

### 🏗️ Technology Stack
```
Frontend:
├── React (UI framework)
├── Vite (build tool)
├── Tailwind CSS (styling)
├── Axios (API calls)
└── Lucide React (icons)

Backend:
├── Node.js (runtime)
├── Express.js (web framework)
├── MongoDB (database)
├── JWT (authentication)
└── Bcrypt (password hashing)

Tools:
├── Git (version control)
├── npm (package manager)
└── MongoDB Atlas (cloud database)
```

---

## Architecture

### 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ React Components (Vite)                                 │   │
│  │ ├── Login/Signup Pages                                  │   │
│  │ ├── Dashboard                                           │   │
│  │ ├── Profile Management                                  │   │
│  │ ├── Admin Panel                                         │   │
│  │ │   ├── User Management                                 │   │
│  │ │   └── Event Log                                       │   │
│  │ └── Settings                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS/REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                        API LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Express.js Server (Port 5000)                           │   │
│  │ ├── Authentication Routes                               │   │
│  │ │   ├── POST /api/signup                                │   │
│  │ │   ├── POST /api/login                                 │   │
│  │ │   └── POST /api/logout                                │   │
│  │ ├── User Routes                                         │   │
│  │ │   ├── GET /api/admin/users                            │   │
│  │ │   ├── PUT /api/admin/users/:id                        │   │
│  │ │   └── DELETE /api/admin/users/:id                     │   │
│  │ ├── Marker Routes                                       │   │
│  │ │   ├── POST /api/markers/upload                        │   │
│  │ │   ├── GET /api/markers/download/:id                   │   │
│  │ │   └── GET /api/markers/stats                          │   │
│  │ ├── Event Routes                                        │   │
│  │ │   └── GET /api/events                                 │   │
│  │ └── Activity Log Routes                                 │   │
│  │     ├── POST /api/activity-log                          │   │
│  │     └── GET /api/activity-log                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Mongoose/MongoDB
┌──────────────────────────▼──────────────────────────────────────┐
│                      DATABASE LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MongoDB Collections                                     │   │
│  │ ├── Users                                               │   │
│  │ │   └── fullname, email, password, role, ...           │   │
│  │ ├── Markers                                             │   │
│  │ │   └── filename, filepath, uploadedBy, ...            │   │
│  │ ├── Events                                              │   │
│  │ │   └── title, description, location, ...              │   │
│  │ └── ActivityLogs                                        │   │
│  │     └── username, email, action, role, ip, ...         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 Request/Response Flow

```
User Action (e.g., Login)
    ↓
Frontend Form Submission
    ↓
Validation (Email, Password, etc.)
    ↓
Sanitization (Remove XSS, etc.)
    ↓
HTTPS POST Request to /api/login
    ↓
Backend Receives Request
    ↓
Middleware: Request Validation
    ↓
Middleware: CORS Check
    ↓
Route Handler Logic
    ↓
Database Query (MongoDB)
    ↓
Response Generation
    ↓
Logging (Activity Log)
    ↓
HTTPS Response to Frontend
    ↓
Frontend Processes Response
    ↓
Update State/Navigate
    ↓
Render Updated UI
```

---

## Database Setup

### 📦 MongoDB Collections

#### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  fullname: String,
  email: String (unique, lowercase),
  password: String (hashed, bcrypt),
  role: String (enum: SUPER_ADMIN, admin, encoder, researcher),
  isEnabled: Boolean (default: true),
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...",
  "role": "researcher",
  "isEnabled": true,
  "lastLoginAt": "2024-01-15T10:30:45.123Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:45.123Z"
}
```

#### 2. **Markers Collection**
```javascript
{
  _id: ObjectId,
  filename: String,
  filepath: String,
  filesize: Number,
  uploadedBy: String (user email),
  uploadedAt: Date,
  location: String,
  latitude: Number,
  longitude: Number,
  description: String,
  metadata: {
    fileType: String,
    hash: String,
    checksumValidated: Boolean
  }
}
```

#### 3. **ActivityLogs Collection**
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  action: String (enum: Login, Sign Out, Uploaded Marker, etc.),
  role: String,
  ipAddress: String,
  details: String,
  userId: ObjectId (ref to User, can be null),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **Events Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  location: String,
  latitude: Number,
  longitude: Number,
  createdBy: String (user email),
  createdAt: Date,
  updatedAt: Date,
  markers: [ObjectId] (references to Markers)
}
```

### 🔐 Indexes for Performance
```javascript
Users:
├── email (unique)
├── role
└── lastLoginAt

Markers:
├── uploadedBy
├── uploadedAt
└── location

ActivityLogs:
├── email
├── action
├── createdAt (descending)
└── email + createdAt

Events:
├── createdBy
└── createdAt
```

---

## Backend Setup

### 📋 Step-by-Step Backend Setup

#### **Step 1: Initialize Backend Project**
```bash
cd backend
npm install
```

**Installs dependencies:**
- express
- mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- express-validator
- multer (file uploads)
- And more...

#### **Step 2: Create Environment File**
Create `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/TektonDB

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
```

#### **Step 3: Start Backend Server**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

**Expected output:**
```
✅ [STARTUP] Dependency audit complete - safe to proceed
✅ [STARTUP] Upload directory ready
🚀 Server running on http://localhost:5000
```

#### **Step 4: Verify Backend is Running**
```bash
curl http://localhost:5000/health
# Response: {"status": "ok", "uptime": 123.45}
```

### 🗂️ Backend File Structure
```
backend/
├── config/
│   └── db.js                    (MongoDB connection)
├── middleware/
│   ├── auth.js                  (JWT verification)
│   ├── adminAuth.js             (Admin role check)
│   ├── validation.js            (Input validation)
│   ├── securityConfig.js        (Security headers)
│   ├── fileUpload.js            (File handling)
│   └── dataIntegrity.js         (Checksum verification)
├── models/
│   ├── user.js                  (User schema)
│   ├── marker.js                (Marker schema)
│   ├── event.js                 (Event schema)
│   └── activityLog.js           (Activity log schema)
├── routes/
│   ├── auth.js                  (Signup route)
│   ├── login.js                 (Login route)
│   ├── logout.js                (Logout route - NEW)
│   ├── markerRoutes.js          (Marker operations)
│   ├── eventRoutes.js           (Event operations)
│   ├── adminRoutes.js           (Admin operations)
│   ├── adminUserRoutes.js       (User management)
│   └── activityLogRoutes.js     (Activity logging)
├── scripts/
│   └── createSuperAdmin.js      (Setup script)
├── server.js                    (Main server file)
├── logger.js                    (Logging utility)
└── package.json
```

---

## Frontend Setup

### 📋 Step-by-Step Frontend Setup

#### **Step 1: Initialize Frontend Project**
```bash
cd frontend  # (if separate from root)
npm install
```

**Installs dependencies:**
- react
- react-router-dom
- axios
- tailwindcss
- lucide-react
- framer-motion
- And more...

#### **Step 2: Create Environment File**
Create `.env` or configure in `vite.config.js`:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Tekton Website
```

#### **Step 3: Start Frontend Development Server**
```bash
npm run dev
# or
npm start
```

**Expected output:**
```
  VITE v4.x.x  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

#### **Step 4: Access Application**
Open browser to `http://localhost:5173/`

### 🗂️ Frontend File Structure
```
src/
├── components/
│   └── ProtectedAdminRoute.jsx  (Admin guard component)
├── AdminPanel/
│   └── AdminPanel.jsx           (Admin dashboard)
├── Dashboard/
│   └── Dashboard.jsx            (User dashboard)
├── EventLog/
│   └── EventLog.jsx             (Activity viewer)
├── Login/
│   └── Login.jsx                (Login page)
├── Signup/
│   └── Signup.jsx               (Registration page)
├── Profile/
│   └── Profile.jsx              (User profile)
├── Settings/
│   └── Settings.jsx             (Settings page)
├── Delete/
│   └── delete.jsx               (Delete account)
├── Analytics/
│   └── Analytics.jsx            (Analytics view)
├── ThemeLoader/
│   └── ThemeLoader.jsx          (Theme management)
├── pages/
│   └── TektonWelcome.jsx        (Welcome page)
├── App.jsx                      (Main component)
├── main.jsx                     (Entry point)
├── App.css
├── index.css
└── assets/                      (Images, etc.)
```

---

## User Workflows

### 🔐 User Registration Workflow

```
Step 1: User Opens Application
├── Navigate to http://localhost:5173
└── See Welcome Page

Step 2: Click "Sign Up"
├── Redirected to /signup
└── See registration form

Step 3: Fill Registration Form
├── Enter Full Name
├── Enter Email
├── Enter Password (min 8 chars, uppercase, number, special)
└── Select Role (Researcher, Encoder, Admin)

Step 4: Frontend Validation
├── Check email format ✓
├── Check password strength ✓
├── Sanitize input (remove XSS) ✓
└── Display errors if invalid

Step 5: Submit to Backend
├── POST /api/signup
│   {
│     fullname: "John Doe",
│     email: "john@example.com",
│     password: "SecurePass123!",
│     role: "researcher"
│   }
└── Send over HTTPS

Step 6: Backend Validation
├── Validate email format
├── Validate password strength
├── Validate fullname
└── Return 400 if invalid

Step 7: Check Duplicate User
├── Query: User.findOne({email})
├── If exists: Return 409 Conflict
└── If new: Continue

Step 8: Hash Password
├── Use bcrypt with 10 rounds
└── Create salt + hash

Step 9: Store in Database
├── Create user record:
│   {
│     fullname: "John Doe",
│     email: "john@example.com",
│     password: "$2a$10$...",
│     role: "researcher",
│     isEnabled: true
│   }
└── Save to MongoDB

Step 10: Log Activity
├── Create ActivityLog:
│   {
│     username: "John Doe",
│     email: "john@example.com",
│     action: "Login",
│     role: "researcher",
│     ipAddress: "192.168.1.1",
│     details: "Logged in from 192.168.1.1"
│   }
└── Save to MongoDB

Step 11: Return Success
├── Status: 201 Created
└── Return user data (no password)

Step 12: Frontend Receives Response
├── Store token in localStorage
├── Store user info
└── Redirect to /dashboard
```

### 🔑 User Login Workflow

```
Step 1: User Opens Application
├── Navigate to http://localhost:5173
└── See login form

Step 2: Enter Credentials
├── Enter Email
├── Enter Password
└── Click "Log In"

Step 3: Frontend Validation
├── Check email format
├── Check password not empty
└── Display errors if invalid

Step 4: Submit to Backend
├── POST /api/login
│   {
│     email: "john@example.com",
│     password: "SecurePass123!"
│   }
└── Send over HTTPS

Step 5: Backend Lookup User
├── Query: User.findOne({email})
├── If not found: Return 400 "User not found"
└── If found: Continue

Step 6: Verify Password
├── Compare: bcrypt.compare(password, hashedPassword)
├── If no match: Return 400 "Invalid password"
└── If match: Continue

Step 7: Check Account Status
├── If isEnabled = false: Return 403 "Account deactivated"
└── If isEnabled = true: Continue

Step 8: Update Last Login
├── Set user.lastLoginAt = Date.now()
├── Save to database
└── Continue

Step 9: Log Login Activity
├── Create ActivityLog:
│   {
│     username: "John Doe",
│     email: "john@example.com",
│     action: "Login",
│     details: "Logged in from 192.168.1.1",
│     userId: user._id
│   }
└── Save to MongoDB

Step 10: Generate JWT Token
├── jwt.sign({
│     userId: user._id,
│     role: user.role
│   }, JWT_SECRET, {expiresIn: "1d"})
└── Token valid for 24 hours

Step 11: Return Success
├── Status: 200 OK
├── Return: {token, fullname, role}
└── Send over HTTPS

Step 12: Frontend Receives Token
├── Store token in localStorage
├── Store user info in localStorage
└── Redirect to /dashboard

Step 13: Access Protected Routes
├── Include token in Authorization header
├── Each request: Authorization: Bearer <token>
└── Backend verifies token with auth middleware
```

### 🚪 User Logout Workflow (NEW)

```
Step 1: User Clicks "Sign Out" or "Log Out"
├── Available in:
│   ├── Admin Panel sidebar
│   ├── Dashboard sidebar
│   └── Profile page sidebar
└── Click sign out button

Step 2: Frontend Calls Logout API
├── POST /api/logout
├── Include Authorization header with JWT token
└── Send over HTTPS

Step 3: Backend Receives Logout Request
├── Middleware: Verify JWT token is valid
├── Extract user info from token:
│   ├── username
│   ├── email
│   ├── role
│   └── Get IP address from request
└── Continue

Step 4: Create Sign-Out Event
├── Create ActivityLog document:
│   {
│     username: "John Doe",
│     email: "john@example.com",
│     action: "Sign Out",
│     role: "researcher",
│     ipAddress: "192.168.1.1",
│     details: "Signed out from 192.168.1.1",
│     userId: null  (per design)
│   }
└── Save to MongoDB

Step 5: Return Success
├── Status: 200 OK
├── Message: "Logged out successfully"
└── Send over HTTPS

Step 6: Frontend Receives Response
├── (Logout continues even if logging fails)
├── Clear localStorage:
│   ├── token
│   ├── fullname
│   ├── email
│   └── userId
└── Continue

Step 7: Show Notification
├── Display: "Logged out successfully"
├── Auto-hide after 3 seconds
└── Continue

Step 8: Redirect to Login
├── Navigate to /login
└── User sees login form again

Step 9: Verify Event Logged
├── Admin can view in Event Log
├── Shows:
│   ├── Date & Time of logout
│   ├── Username
│   ├── Email
│   ├── Role: "researcher"
│   ├── Action: "Sign Out" (slate badge)
│   └── Details with IP address
└── Complete audit trail
```

### 📁 Upload Marker Workflow

```
Step 1: User Navigates to Dashboard
├── POST /api/login successful
├── JWT token stored
└── Redirected to /dashboard

Step 2: Click "Upload Marker"
├── Opens file upload dialog
├── Select .kml, .kmz, or .zip file
└── Max size: 10MB

Step 3: Frontend Validation
├── Check file exists ✓
├── Check file size < 10MB ✓
├── Check file type (extension) ✓
└── Show errors if invalid

Step 4: Create FormData
├── Include:
│   ├── file (binary)
│   ├── filename
│   └── Other metadata
└── Prepare for upload

Step 5: Submit to Backend
├── POST /api/markers/upload
├── Include:
│   ├── Authorization: Bearer <token>
│   ├── Content-Type: multipart/form-data
│   └── File data
└── Send over HTTPS

Step 6: Backend Receives Upload
├── Middleware: Verify JWT token
├── Middleware: Validate file
└── Route handler: Process upload

Step 7: Security Checks
├── Validate file MIME type
├── Check file size limit
├── Scan for malicious content
├── Prevent path traversal
└── Continue if all pass

Step 8: Generate File Hash
├── Calculate SHA-256 checksum
├── Store for integrity checking
└── Continue

Step 9: Store File
├── Save to: ./uploads/filename
├── Generate unique filename
├── Store metadata
└── Save to uploads directory

Step 10: Create Database Record
├── Create Marker document:
│   {
│     filename: "survey_2024_01.kml",
│     filepath: "./uploads/survey_...",
│     filesize: 1024000,
│     uploadedBy: "john@example.com",
│     uploadedAt: Date.now(),
│     metadata: {
│       hash: "sha256...",
│       checksumValidated: true
│     }
│   }
└── Save to MongoDB

Step 11: Log Activity
├── Create ActivityLog:
│   {
│     username: "John Doe",
│     email: "john@example.com",
│     action: "Uploaded Marker",
│     details: "Uploaded file: survey_2024_01.kml",
│     userId: user._id
│   }
└── Save to MongoDB

Step 12: Return Success
├── Status: 201 Created
├── Return: {markerId, filename, uploadedAt}
└── Send over HTTPS

Step 13: Frontend Receives Response
├── Show success notification
├── File added to user's list
├── Clear upload form
└── File ready for download
```

### 📥 Download Marker Workflow

```
Step 1: User Views Downloaded Files List
├── On dashboard or profile
├── See list of uploaded markers
└── Each has "Download" button

Step 2: Click "Download"
├── Identify marker ID
└── Send request

Step 3: Submit to Backend
├── GET /api/markers/download/:markerId
├── Include Authorization: Bearer <token>
└── Send over HTTPS

Step 4: Backend Verification
├── Middleware: Verify JWT token
├── Find marker by ID
├── Verify user has access
└── Continue if authorized

Step 5: Integrity Check
├── Recalculate file hash
├── Compare with stored hash
├── If mismatch: Return error
└── If match: Continue

Step 6: Log Download Activity
├── Create ActivityLog:
│   {
│     username: "Jane Doe",
│     email: "jane@example.com",
│     action: "Downloaded File",
│     details: "Downloaded: survey_2024_01.kml",
│     userId: user._id
│   }
└── Save to MongoDB

Step 7: Send File
├── Read file from disk
├── Set headers:
│   ├── Content-Type: application/vnd.google-earth.kml
│   ├── Content-Disposition: attachment
│   └── Content-Length: filesize
└── Send file data

Step 8: Frontend Receives File
├── Browser detects download
├── Save to Downloads folder
└── User can access file

Step 9: Verify Download
├── File size matches
├── File integrity verified
└── Ready for use
```

---

## Admin Workflows

### 👥 User Management Workflow

#### **View All Users**
```
Step 1: Admin Logs In
├── POST /api/login as admin user
└── Token includes role: "admin"

Step 2: Navigate to Admin Panel
├── Click "Admin Panel" button
├── Redirected to /admin
└── Access admin dashboard

Step 3: Click "User Management"
├── Open User Management tab
├── GET /api/admin/users
├── Include Authorization header
└── Backend verifies admin role

Step 4: Backend Returns Users
├── Query all users from database
├── Return: [{user}, {user}, ...]
├── Include:
│   ├── email
│   ├── fullname
│   ├── role
│   ├── isEnabled status
│   ├── createdAt
│   └── lastLoginAt
└── Return 200 OK

Step 5: Frontend Displays Users
├── Show table with columns:
│   ├── Email
│   ├── Full Name
│   ├── Joined Date
│   ├── Status (Active/Deactivated)
│   ├── Role
│   └── Actions (Edit, Toggle, Delete)
├── Show search bar
├── Show filter dropdown (All/Online/Offline)
└── Show total user count
```

#### **Edit User**
```
Step 1: Admin Clicks "Edit"
├── Select user from table
└── Click edit button

Step 2: Open Edit Modal
├── Show user's current data:
│   ├── Email field
│   ├── Full Name field
│   ├── Role dropdown
│   └── Password field (optional)
└── Modal has Save/Cancel buttons

Step 3: Modify Fields
├── Change email, name, role, or password
├── Password is optional (leave empty to keep)
└── Click "Save Changes"

Step 4: Frontend Validation
├── Check email format
├── Check fullname not empty
├── Check role selected
└── Display errors if invalid

Step 5: Submit to Backend
├── PUT /api/admin/users/:userId
├── Send updated data:
│   {
│     email: "newemail@example.com",
│     fullname: "New Name",
│     password: "NewPass123!" (optional)
│   }
├── Include Authorization header
└── Send over HTTPS

Step 6: Backend Updates User
├── Middleware: Verify admin role
├── Find user by ID
├── If password included: Hash with bcrypt
├── Update fields
├── If role changed: PUT /api/admin/users/:id/role
└── Save to database

Step 7: Log Activity
├── Create ActivityLog (optional)
├── Or just return success
└── Continue

Step 8: Return Success
├── Status: 200 OK
├── Return updated user data
└── Send over HTTPS

Step 9: Frontend Updates UI
├── Close modal
├── Update user in table
├── Show success notification
└── "User updated successfully"
```

#### **Deactivate/Activate User**
```
Step 1: Admin Wants to Disable User
├── See user in table
├── Click "Deactivate" button
└── Confirm action

Step 2: Submit to Backend
├── PUT /api/admin/users/:userId/toggle-status
├── Send: {active: false}
├── Include Authorization header
└── Send over HTTPS

Step 3: Backend Updates Status
├── Middleware: Verify admin role
├── Find user by ID
├── Set: user.isEnabled = false
└── Save to database

Step 4: Return Success
├── Status: 200 OK
├── Return updated user
└── Send over HTTPS

Step 5: Frontend Updates UI
├── Update status badge to "Deactivated"
├── Show success notification
└── User cannot login anymore

Step 6: User Tries to Login
├── POST /api/login
├── Backend checks: isEnabled = false
├── Return 403: "Account has been deactivated"
└── Show error to user
```

#### **Delete User**
```
Step 1: Admin Clicks Delete
├── Select user from table
├── Click delete button
├── Confirm: "Are you sure?"
└── Cannot be undone

Step 2: Submit to Backend
├── DELETE /api/admin/users/:userId
├── Include Authorization header
└── Send over HTTPS

Step 3: Backend Deletes User
├── Middleware: Verify admin role
├── Check if super admin (cannot delete)
├── Find user by ID
├── Delete from database
└── Return success

Step 4: Frontend Updates UI
├── Remove user from table
├── Show success notification
├── "User deleted successfully"
└── Update total user count
```

### 📊 View Event Log Workflow

```
Step 1: Admin Opens Admin Panel
├── POST /api/login as admin
├── Redirected to /admin
└── Access admin dashboard

Step 2: Click "Event Log"
├── Switch to Event Log tab
├── GET /api/activity-log
├── Include Authorization header
├── Include pagination: ?page=1&limit=20
└── Send over HTTPS

Step 3: Backend Returns Logs
├── Middleware: Verify admin role
├── Query ActivityLog collection
├── Sort by createdAt descending
├── Apply pagination
├── Return: {data: [logs], pagination: {...}}
└── Return 200 OK

Step 4: Frontend Displays Logs
├── Show table with columns:
│   ├── Date & Time
│   ├── Username
│   ├── Email
│   ├── Role (NEW)
│   ├── Action (with color badge)
│   └── Details
├── Show search bar
├── Show action filter dropdown
├── Show "Export CSV" button
└── Show pagination controls

Step 5: Search Logs
├── Enter search term
├── Filter by: username, email, action, role, details
├── Results update in real-time
└── Show count of matching logs

Step 6: Filter by Action
├── Select action from dropdown:
│   ├── All Actions
│   ├── Login
│   ├── Sign Out (NEW)
│   ├── Uploaded Marker
│   ├── Downloaded File
│   ├── Created Survey
│   ├── Updated Survey
│   └── Deleted Marker
├── GET /api/activity-log?action=Login
└── Table updates with filtered results

Step 7: View Sign-Out Events (NEW)
├── Filter by "Sign Out" action
├── See events with:
│   ├── Date & Time of logout
│   ├── Username who logged out
│   ├── Email address
│   ├── Role (e.g., "admin")
│   ├── Action badge (slate gray)
│   └── Details with IP address
├── Hover tooltip shows full details
└── Complete audit trail available

Step 8: Export to CSV
├── Click "Export CSV"
├── Includes all visible logs
├── Columns: Date, Time, Username, Email, Role, Action, Details
├── Browser downloads file
└── Open in Excel or Google Sheets

Step 9: View Details
├── Scroll horizontally for long details
├── Hover on truncated text to see full message
├── Scroll vertically in details cell
└── Details column allows reading long text

Step 10: Pagination
├── View page 1-5 at bottom
├── Click page number to navigate
├── Previous/Next buttons available
└── Each page shows up to 20 logs
```

---

## Security Features

### 🔐 Authentication

#### **Password Security**
```
1. Password Requirements:
   ├── Minimum 8 characters
   ├── At least 1 uppercase letter
   ├── At least 1 number
   ├── At least 1 special character (!@#$%^&*)
   └── Example: "SecurePass123!"

2. Password Storage:
   ├── Never stored in plain text
   ├── Hashed with bcrypt (10 rounds)
   ├── Slow hashing prevents brute force
   └── Each user gets unique salt

3. Password Verification:
   ├── bcrypt.compare(inputPassword, storedHash)
   ├── Returns true/false
   └── Timing attack resistant
```

#### **JWT Token**
```
1. Token Generation:
   ├── jwt.sign({userId, role}, JWT_SECRET)
   ├── Expires in 24 hours
   ├── Contains user ID and role
   └── Example: eyJhbGc...

2. Token Storage:
   ├── Stored in localStorage on client
   ├── Sent in Authorization header
   ├── Included in every protected request
   └── Format: Authorization: Bearer <token>

3. Token Verification:
   ├── jwt.verify(token, JWT_SECRET)
   ├── Done by auth middleware
   ├── If invalid/expired: return 401
   └── If valid: extract userId and role
```

### 🛡️ Authorization & Access Control

#### **Role-Based Access Control**
```
Roles and Permissions:

1. SUPER_ADMIN:
   ├── Can create super admin accounts (script only)
   ├── View all users
   ├── Edit all users
   ├── Delete all users (except self)
   ├── View event logs
   ├── Export data
   └── Full system access

2. admin:
   ├── View all users
   ├── Edit users (except super admin)
   ├── Deactivate/activate users
   ├── Delete users (except super admin)
   ├── View event logs
   ├── Export data
   └── Manage user accounts

3. encoder:
   ├── Upload markers
   ├── Download markers
   ├── Create surveys
   ├── Edit own surveys
   ├── Delete own surveys
   ├── View own activity
   └── Cannot access admin panel

4. researcher:
   ├── Download markers
   ├── View surveys
   ├── Create events (if enabled)
   ├── View own activity
   ├── Cannot upload markers
   └── Cannot access admin panel
```

#### **Route Protection**
```
Public Routes:
├── GET / (welcome page)
├── POST /api/signup (registration)
├── POST /api/login (login)
└── GET /health (health check)

Protected Routes (require token):
├── POST /api/logout
├── GET /api/markers
├── POST /api/markers/upload
├── GET /api/markers/download/:id
├── GET /api/auth/change-password
├── PUT /api/auth/update-profile
├── DELETE /api/auth/delete-account
└── And more...

Admin Routes (require token + admin role):
├── GET /api/admin/users
├── PUT /api/admin/users/:id
├── DELETE /api/admin/users/:id
├── GET /api/activity-log
└── GET /api/admin/stats

Middleware Flow:
├── Check if route protected
├── Check if token present
├── Verify token signature
├── Check token expiration
├── Extract user data
├── Check role permissions
└── Allow/deny request
```

### 🔒 Data Protection

#### **Input Validation**
```
Email Validation:
├── Format check (user@domain.com)
├── Not empty
├── Lowercase conversion
└── Unique in database

Password Validation:
├── Min 8 characters
├── Uppercase letter
├── Number
├── Special character
├── Not empty
└── Cannot contain email

Full Name Validation:
├── Not empty
├── Max 100 characters
├── Remove XSS payloads
└── Trim whitespace

File Upload Validation:
├── File size check (< 10MB)
├── MIME type check
├── Extension whitelist (.kml, .kmz, .zip)
├── Scan for malicious content
└── Prevent path traversal
```

#### **Input Sanitization**
```
XSS Prevention:
├── removeXSS() function
├── Escape HTML entities
├── Remove script tags
├── Remove dangerous attributes
└── Applied to all user input

SQL Injection Prevention:
├── Use Mongoose (ORM)
├── Parameterized queries
├── No string concatenation
└── Built-in protection

Path Traversal Prevention:
├── Validate file paths
├── Prevent ../ navigation
├── Use whitelist of allowed locations
└── Generate safe filenames
```

#### **File Integrity**
```
Checksum Verification:
├── Calculate SHA-256 hash
├── Store with file metadata
├── Recalculate on download
├── Compare hashes
├── Detect tampering

Upload Process:
├── Calculate hash
├── Store in database
└── Compare on download

Download Process:
├── Retrieve stored hash
├── Recalculate file hash
├── Compare:
│   ├── Match: Send file ✓
│   └── Mismatch: Deny download ✗
└── Log integrity check

Tampering Detection:
├── If file modified on disk
├── Hash verification fails
├── Return 400 error
├── Log security event
└── Alert administrator
```

### 🚨 Logging & Monitoring

#### **Activity Logging**
```
Events Logged:
├── User Registration
├── User Login
├── User Sign Out (NEW)
├── File Upload
├── File Download
├── Survey Create/Update/Delete
├── User Edit (by admin)
├── User Deactivation (by admin)
└── Failed login attempts

Log Data:
├── Username
├── Email
├── Action type
├── Role
├── IP address
├── Timestamp
├── Details/context
└── Result (success/failure)

Audit Trail Benefits:
├── Security investigations
├── Compliance reporting
├── User behavior analysis
├── Incident response
├── Performance monitoring
└── Full accountability
```

---

## Event Logging (NEW)

### 📝 Sign-Out Event Logging

#### **What Gets Logged**
```
When User Signs Out:

1. Automatic Capture:
   ├── Username: "John Doe"
   ├── Email: "john@example.com"
   ├── Role: "admin"
   ├── IP Address: "192.168.1.100"
   ├── Timestamp: "2024-01-15T10:30:45.123Z"
   └── Action: "Sign Out"

2. Database Record:
   {
     username: "John Doe",
     email: "john@example.com",
     action: "Sign Out",
     role: "admin",
     ipAddress: "192.168.1.100",
     details: "Signed out from 192.168.1.100",
     userId: null,
     createdAt: "2024-01-15T10:30:45.123Z"
   }

3. View in Event Log:
   ├── Date & Time: Jan 15, 2024 10:30:45
   ├── Username: John Doe
   ├── Email: john@example.com
   ├── Role: admin (badge)
   ├── Action: Sign Out (slate badge)
   ├── Details: "Signed out from 192.168.1.100"
   └── Full audit trail
```

#### **Accessing Sign-Out Events**
```
Step 1: Admin Logs In
├── Access Admin Panel
└── Navigate to Event Log

Step 2: View All Events
├── All logged events display:
│   ├── Login events
│   ├── Sign Out events (NEW)
│   ├── Upload events
│   ├── Download events
│   └── Other actions
└── Table shows all with timestamps

Step 3: Filter by Sign-Out
├── Click Action dropdown
├── Select "Sign Out"
├── Shows only sign-out events:
│   ├── Who signed out
│   ├── When they signed out
│   ├── From what IP
│   └── What role they had
└── Export to CSV if needed

Step 4: Search Sign-Outs
├── Search by username
├── Search by email
├── Search by action "Sign Out"
└── Results show matching events

Step 5: View Details
├── See IP address
├── See timestamp
├── See role at time of logout
├── See username and email
└── Complete audit trail

Step 6: Export for Compliance
├── Click "Export CSV"
├── Includes all events (or filtered)
├── Columns: Date, Time, Username, Email, Role, Action, Details
├── Open in Excel
└── Archive for records
```

---

## Troubleshooting

### 🐛 Common Issues & Solutions

#### **Backend Issues**

**Problem: "Cannot connect to MongoDB"**
```
Solution:
1. Check MONGO_URI in .env
2. Verify connection string format:
   mongodb+srv://username:password@cluster.mongodb.net/dbname
3. Ensure whitelist IP in MongoDB Atlas:
   ├── Go to Network Access
   ├── Add 0.0.0.0/0 for development
   └── Restrict for production
4. Test connection: npm run test-db
5. Check firewall/antivirus blocking
```

**Problem: "JWT token expired"**
```
Solution:
1. Token expires after 24 hours
2. User needs to login again
3. Implement token refresh (future feature)
4. For now: Delete token from localStorage
5. Login again
```

**Problem: "Cannot read property 'role' of undefined"**
```
Solution:
1. Auth middleware not verifying token correctly
2. Check token in Authorization header
3. Format: Authorization: Bearer <token>
4. Verify JWT_SECRET in .env matches
5. Check token hasn't expired
6. Restart backend server
```

#### **Frontend Issues**

**Problem: "API call returns 401"**
```
Solution:
1. Not authenticated - login first
2. Token might be expired - login again
3. Check localStorage has token
4. Check axios headers include token
5. Verify backend is running on port 5000
```

**Problem: "File upload fails"**
```
Solution:
1. Check file size < 10MB
2. Verify file type (only .kml, .kmz, .zip)
3. Check CORS is enabled
4. Ensure uploads directory exists
5. Check file permissions
```

**Problem: "UI shows long text cut off"**
```
Solution:
1. This was fixed in the UI update
2. Scroll horizontally in table
3. Hover over text to see full content
4. Details column has internal scroll
5. Check browser window size
```

#### **Database Issues**

**Problem: "Duplicate key error on email"**
```
Solution:
1. Email already exists in database
2. Check Users collection:
   db.users.find({email: "test@example.com"})
3. If duplicate: Delete one manually
4. Or create account with different email
```

**Problem: "Query returns no results"**
```
Solution:
1. Check collection name (case-sensitive)
2. Verify document exists
3. Check query parameters
4. Try broader search
5. Check user permissions
```

---

## Deployment

### 🚀 Production Deployment Steps

#### **Step 1: Prepare Code**
```bash
# Update .env for production
NODE_ENV=production
JWT_SECRET=<long-random-secret>
MONGO_URI=mongodb+srv://prod_user:password@prod-cluster.mongodb.net/TektonDB
ALLOWED_ORIGINS=https://tekton.example.com

# Build frontend
cd frontend
npm run build
# Creates dist/ folder with optimized code

# Verify backend
cd backend
npm list  # Check all dependencies
npm audit  # Check for vulnerabilities
```

#### **Step 2: Set Up Server**
```bash
# SSH into production server
ssh user@production-server.com

# Clone repository
git clone https://github.com/kevinmorri921/TektonWebsite.git
cd TektonWebsite

# Install dependencies
npm install  # Root
cd backend && npm install
cd ../frontend && npm install

# Create .env files with production values
# (See Step 1 above)
```

#### **Step 3: Start Services**
```bash
# Start backend (use process manager like PM2)
cd backend
npm install -g pm2
pm2 start server.js --name "tekton-api"
pm2 startup
pm2 save

# Start frontend (if separate)
cd frontend
npm run build
# Serve dist/ with nginx or web server
```

#### **Step 4: Configure Reverse Proxy (Nginx)**
```nginx
# /etc/nginx/sites-available/tekton

server {
    listen 443 ssl http2;
    server_name tekton.example.com;

    ssl_certificate /etc/ssl/certs/tekton.crt;
    ssl_certificate_key /etc/ssl/private/tekton.key;

    # Frontend
    location / {
        root /var/www/tekton/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CORS headers
    add_header Access-Control-Allow-Origin "https://tekton.example.com";
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tekton.example.com;
    return 301 https://$server_name$request_uri;
}
```

#### **Step 5: SSL Certificate**
```bash
# Use Let's Encrypt (free)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tekton.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### **Step 6: Monitor Health**
```bash
# Check backend status
pm2 status

# View logs
pm2 logs tekton-api

# Monitor resources
pm2 monit

# Regular health check endpoint
curl https://tekton.example.com/health
```

#### **Step 7: Database Backup**
```bash
# Daily backup script
#!/bin/bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/TektonDB" \
  --out /backups/tekton-$(date +%Y%m%d)

# Restore if needed
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/TektonDB" \
  /backups/tekton-20240115
```

---

## Summary

### ✅ System Complete With:
- ✅ User authentication (signup/login/logout)
- ✅ Role-based access control (4 roles)
- ✅ File upload/download with integrity checking
- ✅ Survey management
- ✅ Comprehensive activity logging
- ✅ **NEW: Sign-out event logging**
- ✅ Admin panel for user management
- ✅ Event log viewer with filtering
- ✅ Security features (validation, sanitization, encryption)
- ✅ Responsive UI with Tailwind CSS
- ✅ **NEW: Fixed Event Log UI with scrollbars**

### 📊 Database: 4 Collections
1. **Users** - User accounts and authentication
2. **Markers** - Uploaded files and metadata
3. **Events** - Survey events and locations
4. **ActivityLogs** - Complete audit trail (includes sign-outs)

### 🔐 Security Features:
- JWT authentication
- Password hashing (bcrypt)
- Input validation & sanitization
- Role-based authorization
- File integrity checks (SHA-256)
- Activity logging & audit trail
- HTTPS/TLS encryption
- CORS protection

### 🎨 UI Features:
- Responsive design with Tailwind
- Admin panel for management
- Event log with filtering & export
- User profile management
- Activity tracking
- **NEW: Scrollable event log table**
- **NEW: Sign-out events visible**

---

**Last Updated:** November 26, 2025  
**Status:** ✅ Complete & Production Ready
