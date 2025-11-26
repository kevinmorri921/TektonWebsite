# 🎨 Frontend Step-by-Step Guide - Tekton Website

## Table of Contents
1. [Frontend Architecture Overview](#frontend-architecture-overview)
2. [Project Structure](#project-structure)
3. [Setup & Initialization](#setup--initialization)
4. [Component Hierarchy](#component-hierarchy)
5. [Routing System](#routing-system)
6. [State Management](#state-management)
7. [Authentication Flow](#authentication-flow)
8. [User Workflows](#user-workflows)
9. [UI Components & Styling](#ui-components--styling)
10. [API Integration](#api-integration)
11. [Development Workflow](#development-workflow)
12. [Production Build](#production-build)

---

## Frontend Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────┐
│         TEKTON FRONTEND                 │
├─────────────────────────────────────────┤
│ Framework:    React 18+                 │
│ Build Tool:   Vite (Lightning fast)     │
│ Styling:      Tailwind CSS v3+          │
│ HTTP Client:  Axios                     │
│ Icons:        Lucide React              │
│ Animations:   Framer Motion             │
│ Dev Server:   Port 5173                 │
│ Build Output: dist/                     │
└─────────────────────────────────────────┘
```

### Why These Tools?

| Tool | Why Chosen | Benefit |
|------|-----------|---------|
| **React** | Component-based UI | Reusable, maintainable, fast rendering |
| **Vite** | Next-gen build tool | 10x faster than webpack, instant HMR |
| **Tailwind** | Utility-first CSS | No CSS file bloat, consistent design |
| **Axios** | HTTP client | Interceptors, request cancellation |
| **Lucide** | Icon library | 400+ SVG icons, consistent style |
| **Framer Motion** | Animation lib | Smooth animations, declarative syntax |

---

## Project Structure

```
src/
├── main.jsx                    # Entry point, ReactDOM render
├── App.jsx                     # Root component, routing
├── App.css                     # Global styles
├── index.css                   # Base Tailwind imports
│
├── components/                 # Reusable components
│   └── ProtectedAdminRoute.jsx # Route guard for admin
│
├── pages/
│   └── TektonWelcome.jsx      # Welcome/landing page
│
├── AdminPanel/
│   └── AdminPanel.jsx         # Admin dashboard
│
├── Analytics/
│   └── Analytics.jsx          # Analytics page
│
├── Dashboard/
│   └── Dashboard.jsx          # User dashboard
│
├── Delete/
│   └── delete.jsx             # Delete account page
│
├── EventLog/
│   └── EventLog.jsx           # Activity log viewer
│
├── Login/
│   └── Login.jsx              # Login form
│
├── Profile/
│   └── Profile.jsx            # User profile page
│
├── Settings/
│   └── Settings.jsx           # User settings
│
├── Signup/
│   └── Signup.jsx             # Registration form
│
├── ThemeLoader/
│   └── ThemeLoader.jsx        # Theme management
│
└── assets/                     # Static files (images, etc.)
```

---

## Setup & Initialization

### Step 1: Install Dependencies

```bash
cd c:\Users\RAI\TektonWebsite
npm install
```

**What gets installed:**
- React 18+ with react-dom
- Vite build tool and plugins
- Tailwind CSS with PostCSS
- Axios for HTTP requests
- Lucide React icons (400+ icons)
- Framer Motion for animations
- eslint & prettier for code quality
- All other dev dependencies

**Typical size:** ~500MB (node_modules folder)

### Step 2: Environment Configuration

Create `.env` file in root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Tekton Website
VITE_APP_VERSION=1.0.0
```

**Why?**
- `VITE_API_URL` - Points to backend server
- During dev: `http://localhost:5000`
- During production: `https://your-domain.com`

### Step 3: Understand Entry Point

**File:** `src/main.jsx`

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**What happens:**
1. React loads
2. Finds `<div id="root">` in `index.html`
3. Renders `<App />` component into it
4. Tailwind CSS loads via `index.css`

### Step 4: Root Application Component

**File:** `src/App.jsx`

```javascript
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'
import Login from './Login/Login.jsx'
import Signup from './Signup/Signup.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'
import Profile from './Profile/Profile.jsx'
import Settings from './Settings/Settings.jsx'
import AdminPanel from './AdminPanel/AdminPanel.jsx'
import EventLog from './EventLog/EventLog.jsx'
import Analytics from './Analytics/Analytics.jsx'
import Delete from './Delete/delete.jsx'
import TektonWelcome from './pages/TektonWelcome.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (token) {
      setIsAuthenticated(true)
      setUserRole(role)
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<TektonWelcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/delete-account" 
          element={isAuthenticated ? <Delete /> : <Navigate to="/login" />} 
        />
        
        {/* Admin-only routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute isAuthenticated={isAuthenticated} userRole={userRole}>
              <AdminPanel />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/event-log" 
          element={
            <ProtectedAdminRoute isAuthenticated={isAuthenticated} userRole={userRole}>
              <EventLog />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedAdminRoute isAuthenticated={isAuthenticated} userRole={userRole}>
              <Analytics />
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
```

**Key concepts:**
- **BrowserRouter** - Enables routing
- **Routes** - Container for all route definitions
- **Route** - Maps path to component
- **Navigate** - Redirects to another path
- **useEffect** - Checks localStorage on app load for existing auth
- **Protected routes** - Check if authenticated before showing
- **Admin routes** - Use ProtectedAdminRoute for extra security

---

## Component Hierarchy

### Component Tree

```
App (Root)
├── TektonWelcome (Public)
│   └── Navigation
│       └── Links to Login/Signup
│
├── Login
│   ├── Form inputs
│   ├── Validation
│   └── API call to /api/login
│
├── Signup
│   ├── Form inputs
│   ├── Validation
│   └── API call to /api/signup
│
├── Dashboard (Protected)
│   ├── Navigation bar
│   ├── Welcome section
│   ├── Markers section
│   │   ├─ Upload button
│   │   └─ Markers list
│   ├── Events section
│   │   ├─ Create button
│   │   └─ Events list
│   └── Logout button
│
├── Profile (Protected)
│   ├── User info display
│   ├── Edit form
│   ├── Change password section
│   └── Logout button
│
├── Settings (Protected)
│   ├── Theme selector
│   ├── Preferences
│   └── Logout button
│
├── AdminPanel (Admin-Protected)
│   ├── User management table
│   ├── Edit/Delete users
│   ├── Role assignment
│   └── Logout button
│
├── EventLog (Admin-Protected)
│   ├── Activity log table (NEW: with Sign Out events)
│   ├── Filters
│   ├── Search
│   ├── Export to CSV
│   └── Pagination
│
├── Analytics (Admin-Protected)
│   ├── Charts/Statistics
│   └── Reports
│
└── Delete (Protected)
    ├── Confirmation
    ├── Delete button
    └── Logout button
```

---

## Routing System

### How Routing Works

#### Step 1: URL Changes
User clicks link or types URL:
```
http://localhost:5173/dashboard
```

#### Step 2: React Router Detects
React Router watches URL and matches against defined routes:
```javascript
<Route path="/dashboard" element={<Dashboard />} />
```

#### Step 3: Component Renders
If path matches and auth checks pass:
- Old component unmounts
- New component mounts
- State updates trigger re-render

#### Step 4: User Sees Result
Dashboard page displays on screen

### Protected Routes Implementation

**File:** `src/components/ProtectedAdminRoute.jsx`

```javascript
const ProtectedAdminRoute = ({ isAuthenticated, userRole, children }) => {
  // Check 1: Is user logged in?
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  // Check 2: Does user have admin role?
  const adminRoles = ['admin', 'SUPER_ADMIN']
  if (!adminRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />
  }
  
  // Check passed - show component
  return children
}
```

**Security flow:**
```
User tries /admin
  ↓
ProtectedAdminRoute checks
  ├─ Is authenticated? NO → Redirect to /login
  ├─ Has admin role? NO → Redirect to /dashboard
  └─ Both YES → Show AdminPanel
```

### Route List with Protection

| Path | Component | Protection | Purpose |
|------|-----------|-----------|---------|
| `/` | TektonWelcome | None | Public landing |
| `/login` | Login | None | Login form |
| `/signup` | Signup | None | Registration |
| `/dashboard` | Dashboard | Authenticated | User home |
| `/profile` | Profile | Authenticated | Profile page |
| `/settings` | Settings | Authenticated | Settings |
| `/delete-account` | Delete | Authenticated | Account deletion |
| `/admin` | AdminPanel | Admin only | Manage users |
| `/event-log` | EventLog | Admin only | View logs |
| `/analytics` | Analytics | Admin only | Analytics |

---

## State Management

### How State Works in React

**State** = Data that can change and causes re-renders when updated

### Local State (Individual Component)

**Example from Login.jsx:**

```javascript
import { useState } from 'react'

function Login() {
  // State variables
  const [email, setEmail] = useState('')        // Current: ""
  const [password, setPassword] = useState('')  // Current: ""
  const [loading, setLoading] = useState(false) // Currently loading? false
  const [error, setError] = useState(null)      // Error message or null

  // When input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value)  // Update state
    // Triggers re-render with new value
  }

  return (
    <form>
      <input 
        value={email}
        onChange={handleEmailChange}
        placeholder="Email"
      />
      {/* Display error if exists */}
      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}
```

**State lifecycle:**
```
1. Component mounts
   ↓
2. State initialized with useState defaults
   ↓
3. User types in input
   ↓
4. onChange event triggers setEmail()
   ↓
5. State updates
   ↓
6. React re-renders component
   ↓
7. Input shows new value
```

### Global State (App-Level)

**File:** `src/App.jsx`

```javascript
function App() {
  // Global authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)

  // On app load, check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (token) {
      setIsAuthenticated(true)
      setUserRole(role)
    }
  }, []) // Empty dependency array = run once on mount

  return (
    <Router>
      <Routes>
        {/* All routes can access isAuthenticated and userRole */}
      </Routes>
    </Router>
  )
}
```

**Flow:**
```
App loads
  ↓
useEffect runs
  ↓
Check localStorage for token
  ├─ Found? YES → setIsAuthenticated(true)
  └─ Not found? NO → Stays false
  ↓
Routes render with current state
  ↓
Protected routes check state
```

### Local Storage State Persistence

**What is localStorage?**
- Browser's local storage
- Persists data even after browser closes
- Data stays until explicitly deleted

**How we use it:**

```javascript
// After successful login
localStorage.setItem('token', response.data.token)
localStorage.setItem('fullname', response.data.fullname)
localStorage.setItem('email', response.data.email)
localStorage.setItem('role', response.data.role)

// Later, check if still logged in
const token = localStorage.getItem('token')

// On logout, clear everything
localStorage.removeItem('token')
localStorage.removeItem('fullname')
localStorage.removeItem('email')
localStorage.removeItem('role')
// OR
localStorage.clear() // Removes everything
```

**Why localStorage?**
- User stays logged in after browser refresh
- Auth state persists across page navigation
- No backend session needed with JWT

---

## Authentication Flow

### Complete Authentication Lifecycle

#### Phase 1: User Registration (Signup)

**Step 1: User enters details**
```
Form shows:
├─ Full Name input
├─ Email input
├─ Password input
├─ Confirm Password input
└─ Submit button
```

**Step 2: Validation on frontend**

```javascript
// src/Signup/Signup.jsx
const handleSubmit = async (e) => {
  e.preventDefault()

  // Validate inputs
  if (!fullname.trim()) {
    setError('Full name required')
    return
  }
  if (!email.includes('@')) {
    setError('Valid email required')
    return
  }
  if (password.length < 6) {
    setError('Password must be 6+ characters')
    return
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }

  // Validation passed - proceed to API call
  try {
    setLoading(true)
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/signup`,
      {
        fullname,
        email,
        password
      }
    )
    // Success!
  } catch (err) {
    setError(err.response?.data?.error || 'Signup failed')
  } finally {
    setLoading(false)
  }
}
```

**Step 3: Send to backend**
- HTTPS POST to `/api/signup`
- Body: `{fullname, email, password}`
- No auth header needed (public endpoint)

**Step 4: Backend validates & creates user**
- Backend validates again
- Hashes password with bcrypt
- Saves to MongoDB
- Returns 201 Created

**Step 5: Frontend handles response**
```javascript
// User created successfully
toast.success('Account created! Please login.')
navigate('/login')
```

#### Phase 2: User Login

**Step 1: User enters credentials**
```
Form shows:
├─ Email input
├─ Password input
└─ Login button
```

**Step 2: Frontend validation**

```javascript
if (!email || !password) {
  setError('Email and password required')
  return
}

try {
  setLoading(true)
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/login`,
    { email, password }
  )
  // response.data contains:
  // {
  //   token: "eyJhbGciOiJIUzI1NiIs...",
  //   fullname: "John Doe",
  //   email: "john@example.com",
  //   role: "researcher"
  // }
}
```

**Step 3: Store auth data**
```javascript
// Save to localStorage
localStorage.setItem('token', response.data.token)
localStorage.setItem('fullname', response.data.fullname)
localStorage.setItem('email', response.data.email)
localStorage.setItem('role', response.data.role)

// Update global state in App.jsx
setIsAuthenticated(true)
setUserRole(response.data.role)

// Navigate to dashboard
navigate('/dashboard')
```

**Step 4: User sees dashboard**
```
Dashboard shows:
├─ Welcome message with user's name
├─ Markers section
├─ Events section
└─ Navigation to other pages
```

#### Phase 3: User Makes Authenticated Request

**Step 1: User performs action (e.g., upload marker)**

```javascript
// In Dashboard.jsx
const handleUploadMarker = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token')

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/markers/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`, // Include token
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    console.log('Marker uploaded:', response.data)
  } catch (err) {
    if (err.response?.status === 401) {
      // Token expired or invalid
      localStorage.clear()
      setIsAuthenticated(false)
      navigate('/login')
    }
  }
}
```

**Step 2: Backend receives request with token**
- Backend extracts token from Authorization header
- Verifies JWT signature
- Checks expiration (24 hours)
- Extracts userId from payload
- Continues with request if valid

**Step 3: Successful response or 401 error**
```javascript
// If success (200)
Toast: "File uploaded successfully"

// If 401 Unauthorized
// Token invalid/expired
// Logout user and redirect to login
localStorage.clear()
setIsAuthenticated(false)
navigate('/login')
```

#### Phase 4: User Logout (NEW)

**Step 1: User clicks "Sign Out"**
```
Button in:
├─ AdminPanel
├─ Dashboard
└─ Profile
```

**Step 2: Frontend calls logout endpoint**

```javascript
// All logout buttons now call handleLogout
const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token')
    
    // Call backend logout endpoint
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/logout`,
      {}, // Empty body
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
  } catch (err) {
    console.error('Logout API error:', err)
    // Continue with logout even if API fails
  } finally {
    // Clear auth data
    localStorage.removeItem('token')
    localStorage.removeItem('fullname')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    
    // Update global state
    setIsAuthenticated(false)
    setUserRole(null)
    
    // Show success message
    toast.success('Logged out successfully')
    
    // Redirect to login
    navigate('/login')
  }
}
```

**Step 3: Backend logs sign-out event**
- Creates ActivityLog entry: `{action: "Sign Out", ...}`
- Saves to MongoDB
- Returns 200 success

**Step 4: Frontend completes logout**
- localStorage cleared ✓
- Global state reset ✓
- User redirected to /login ✓
- Sign-out event logged in database ✓

**Step 5: Verification**
- Admin can view sign-out in Event Log
- Shows: username, email, role, IP address, timestamp

---

## User Workflows

### Workflow 1: Register New Account

```
1. User visits http://localhost:5173
   ↓
2. Clicks "Sign Up" link
   ↓
3. Routed to /signup
   ↓
4. Signup component renders with form:
   - Full Name input
   - Email input
   - Password input
   - Confirm Password input
   - Sign Up button
   ↓
5. User enters details and clicks Sign Up
   ↓
6. Frontend validates:
   ├─ All fields filled?
   ├─ Email format valid?
   ├─ Password 6+ chars?
   └─ Passwords match?
   ↓
7. Frontend sends HTTPS POST to /api/signup
   ↓
8. Backend validates again (safety check)
   ↓
9. Backend checks if email already exists
   ↓
10. Backend hashes password with bcrypt
   ↓
11. Backend saves User to MongoDB
   ↓
12. Backend returns 201 + success message
   ↓
13. Frontend shows "Account created!"
   ↓
14. Frontend redirects to /login
   ↓
15. User sees login form
```

### Workflow 2: Login with Email/Password

```
1. User on login page (/login)
   ↓
2. Enters email and password
   ↓
3. Clicks "Login" button
   ↓
4. Frontend validates inputs
   ├─ Email not empty?
   └─ Password not empty?
   ↓
5. Frontend sends HTTPS POST to /api/login
   ↓
6. Backend finds user by email
   ↓
7. Backend compares password with hash
   ├─ Match? → Continue
   └─ No match? → Return 400 error
   ↓
8. Backend checks if account enabled
   ├─ Enabled? → Continue
   └─ Disabled? → Return 403 error
   ↓
9. Backend creates JWT token (expires 24h)
   ↓
10. Backend logs login activity to MongoDB
   ↓
11. Backend returns 200 + token + user info
    {
      token: "eyJhbGc...",
      fullname: "John Doe",
      email: "john@example.com",
      role: "researcher"
    }
   ↓
12. Frontend stores in localStorage:
   ├─ token
   ├─ fullname
   ├─ email
   └─ role
   ↓
13. Frontend sets isAuthenticated = true
   ↓
14. Frontend redirects to /dashboard
   ↓
15. Dashboard component renders:
   ├─ Welcome section (shows user name)
   ├─ Markers section
   ├─ Events section
   └─ Logout button
```

### Workflow 3: Upload Marker File

```
1. User on Dashboard (/dashboard)
   ↓
2. Scrolls to "Markers" section
   ↓
3. Clicks "Upload New Marker" button
   ↓
4. File picker opens (browser native)
   ↓
5. User selects file from computer
   ↓
6. File selected, upload process starts
   ↓
7. Frontend creates FormData object:
   FormData {
     file: [File object]
   }
   ↓
8. Frontend reads token from localStorage
   ↓
9. Frontend sends HTTPS POST to /api/markers/upload
   Headers:
   - Authorization: Bearer [token]
   - Content-Type: multipart/form-data
   Body: FormData with file
   ↓
10. Backend receives request
    ↓
11. Backend validates token (auth middleware)
    ├─ Valid? → Continue
    └─ Invalid? → Return 401
    ↓
12. Backend validates file:
    ├─ File exists?
    ├─ File size under limit? (e.g., 100MB)
    └─ File type allowed?
    ↓
13. Backend generates SHA-256 hash of file
    ↓
14. Backend saves file to disk at uploads/[filename]
    ↓
15. Backend creates Marker record in MongoDB:
    {
      filename: "survey_data.xlsx",
      filepath: "/uploads/survey_data_123.xlsx",
      filesize: 2048576,
      uploadedBy: "john@example.com",
      uploadedAt: "2024-11-26T10:30:00Z",
      metadata: {
        hash: "abc123def456...",
        checksumValidated: true
      }
    }
    ↓
16. Backend logs activity to ActivityLog
    ↓
17. Backend returns 200 + marker info
    ↓
18. Frontend shows success toast:
    "Marker uploaded successfully"
    ↓
19. Frontend adds new marker to list on screen
    ↓
20. User sees uploaded file in Markers section
```

### Workflow 4: Download Marker File

```
1. User viewing marker in Dashboard/AdminPanel
   ↓
2. Clicks "Download" button next to marker
   ↓
3. Frontend gets marker ID
   ↓
4. Frontend reads token from localStorage
   ↓
5. Frontend sends HTTPS GET to /api/markers/download/[markerID]
   Headers:
   - Authorization: Bearer [token]
   ↓
6. Backend receives request
   ↓
7. Backend validates token
   ↓
8. Backend finds marker in MongoDB
   ↓
9. Backend reads file from disk
   ↓
10. Backend recalculates SHA-256 hash
   ↓
11. Backend compares with stored hash
    ├─ Match? → File intact, continue
    └─ No match? → File corrupted, return error
    ↓
12. Backend logs download activity
    ↓
13. Backend sends file in response
    ├─ Content-Type: application/octet-stream
    ├─ Content-Disposition: attachment
    └─ File data as binary
    ↓
14. Browser triggers download
    ↓
15. File saved to user's Downloads folder
    ↓
16. Frontend shows success toast:
    "Marker downloaded successfully"
```

### Workflow 5: Sign Out (NEW - Step by Step)

```
1. User on any authenticated page (Dashboard/Profile/AdminPanel)
   ↓
2. Clicks "Sign Out" button
   ↓
3. handleLogout function triggered
   ↓
4. Frontend gets token from localStorage
   ↓
5. Frontend sends HTTPS POST to /api/logout
   Headers:
   - Authorization: Bearer [token]
   ↓
6. Backend receives logout request
   ↓
7. Backend validates token (auth middleware)
   ├─ Valid? → Extract user data
   └─ Invalid? → Still proceed to logout
   ↓
8. Backend extracts from token:
   ├─ userId
   ├─ role
   ├─ Query database for fullname/email
   └─ Get IP address from request
   ↓
9. Backend creates ActivityLog entry:
   {
     username: "John Doe",
     email: "john@example.com",
     action: "Sign Out",
     role: "admin",
     ipAddress: "192.168.1.100",
     details: "Signed out from 192.168.1.100",
     userId: null,  // Important: null for signout
     createdAt: Date.now()
   }
   ↓
10. Backend saves ActivityLog to MongoDB
    ↓
11. Backend returns 200 + success message
    ↓
12. Frontend clears localStorage:
    ├─ token
    ├─ fullname
    ├─ email
    └─ role
    ↓
13. Frontend updates App state:
    ├─ setIsAuthenticated(false)
    └─ setUserRole(null)
    ↓
14. Frontend shows toast notification:
    "Logged out successfully"
    ↓
15. Frontend redirects to /login
    ↓
16. User sees login form
    ↓
17. Admin can verify sign-out:
    - Log in as admin
    - Go to /event-log
    - See new entry:
      * Date: 2024-11-26 10:45
      * Username: John Doe
      * Email: john@example.com
      * Action: Sign Out
      * Role: admin
      * IP Address: 192.168.1.100
      * Details: "Signed out from 192.168.1.100"
```

---

## UI Components & Styling

### Tailwind CSS Basics

**Tailwind** = Utility-first CSS framework

Instead of:
```css
.button {
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
}
```

We write:
```jsx
<button className="bg-blue-500 text-white px-5 py-2 rounded">
  Click me
</button>
```

**Why?**
- Faster to develop
- Consistent design
- No naming conflicts
- Smaller CSS file
- Easy to customize

### Common Tailwind Classes

| What | Class | Example |
|------|-------|---------|
| **Colors** | `bg-[color]-[shade]` | `bg-blue-500`, `text-red-600` |
| **Padding** | `p-[size]` `px-` `py-` | `p-4`, `px-6`, `py-2` |
| **Margin** | `m-[size]` `mx-` `my-` | `m-2`, `mx-auto` |
| **Width** | `w-full` `w-1/2` `w-[px]` | `w-full`, `w-96` |
| **Height** | `h-full` `h-screen` | `h-96` |
| **Flexbox** | `flex` `justify-center` `items-center` | `flex justify-between` |
| **Grid** | `grid` `grid-cols-2` | `grid grid-cols-3 gap-4` |
| **Text** | `text-[size]` `font-bold` | `text-lg`, `font-semibold` |
| **Rounded** | `rounded` `rounded-lg` | `rounded-full`, `rounded-[10px]` |
| **Hover** | `hover:[effect]` | `hover:bg-blue-600`, `hover:scale-105` |
| **Border** | `border` `border-[color]` | `border border-gray-300` |
| **Shadow** | `shadow` `shadow-lg` | `shadow-md`, `shadow-2xl` |

### Component Examples

#### Button Component

```jsx
// Simple button with hover effect
<button className="
  px-6 py-2 
  bg-blue-500 text-white 
  rounded-lg 
  hover:bg-blue-600 
  transition duration-200
">
  Click Me
</button>
```

**Breakdown:**
- `px-6 py-2` - Horizontal & vertical padding
- `bg-blue-500` - Blue background
- `text-white` - White text
- `rounded-lg` - Rounded corners
- `hover:bg-blue-600` - Darker on hover
- `transition duration-200` - Smooth animation

#### Form Input Component

```jsx
<input
  type="email"
  placeholder="Enter email"
  className="
    w-full
    px-4 py-2
    border border-gray-300
    rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500
    placeholder-gray-500
  "
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Breakdown:**
- `w-full` - Fill width of container
- `px-4 py-2` - Internal padding
- `border border-gray-300` - Gray border
- `rounded-lg` - Rounded corners
- `focus:outline-none focus:ring-2 focus:ring-blue-500` - Blue ring on focus
- `placeholder-gray-500` - Gray placeholder text

#### Card Component

```jsx
<div className="
  bg-white
  rounded-xl
  shadow-lg
  p-6
  border border-gray-200
">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <p className="text-gray-600 mb-6">Description</p>
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

### Responsive Design

Tailwind uses **mobile-first** approach:

```jsx
<div className="
  grid
  grid-cols-1      // 1 column on mobile
  md:grid-cols-2   // 2 columns on medium screens
  lg:grid-cols-3   // 3 columns on large screens
  gap-4
">
  {/* Items */}
</div>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## API Integration

### How Axios Works

**Axios** = HTTP client for making requests

### Basic Request Structure

```javascript
import axios from 'axios'

// Configure base URL
const API_URL = import.meta.env.VITE_API_URL // http://localhost:5000

// Simple GET request
try {
  const response = await axios.get(`${API_URL}/api/users`)
  console.log(response.data) // Response body
  console.log(response.status) // 200, 404, etc.
} catch (error) {
  console.log(error.response?.status) // Error code
  console.log(error.response?.data) // Error message
}
```

### Request with Authentication

```javascript
const token = localStorage.getItem('token')

const response = await axios.post(
  `${API_URL}/api/markers/upload`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
)
```

**Header breakdown:**
- `Authorization: Bearer [token]` - JWT token for auth
- `Content-Type: multipart/form-data` - Uploading file

### Common API Patterns

#### GET - Fetch Data

```javascript
// List all users (admin only)
const getUsers = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/admin/users`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    setUsers(response.data.users)
  } catch (err) {
    console.error('Error fetching users:', err)
  }
}
```

#### POST - Create Data

```javascript
// Create event
const createEvent = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/api/events`,
      {
        title: 'Survey 2024',
        description: 'Annual survey',
        location: 'New York'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    console.log('Event created:', response.data)
  } catch (err) {
    console.error('Error creating event:', err)
  }
}
```

#### PUT - Update Data

```javascript
// Update user profile
const updateProfile = async () => {
  try {
    const response = await axios.put(
      `${API_URL}/api/profile`,
      {
        fullname: 'Jane Doe',
        email: 'jane@example.com'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    console.log('Profile updated:', response.data)
  } catch (err) {
    console.error('Error updating profile:', err)
  }
}
```

#### DELETE - Remove Data

```javascript
// Delete marker
const deleteMarker = async (markerID) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/markers/${markerID}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    console.log('Marker deleted')
  } catch (err) {
    console.error('Error deleting marker:', err)
  }
}
```

### Error Handling Pattern

```javascript
try {
  setLoading(true)
  const response = await axios.post(`${API_URL}/api/login`, {email, password})
  
  // Success
  localStorage.setItem('token', response.data.token)
  setSuccess('Login successful!')
  
} catch (error) {
  // Handle different error types
  if (error.response?.status === 401) {
    setError('Invalid email or password')
  } else if (error.response?.status === 404) {
    setError('User not found')
  } else if (error.response?.status === 500) {
    setError('Server error. Please try again later')
  } else if (error.request && !error.response) {
    setError('Network error. Check your connection')
  } else {
    setError('An error occurred')
  }
  
} finally {
  setLoading(false)
}
```

---

## Development Workflow

### Step 1: Start Development Server

```bash
cd c:\Users\RAI\TektonWebsite
npm run dev
```

**Output:**
```
  VITE v4.4.9  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**What happens:**
- Vite starts dev server on port 5173
- Watches for file changes
- Hot Module Replacement (HMR) enabled
- Changes instantly reflect in browser

### Step 2: Make Component Changes

**Example: Edit Dashboard.jsx**

```javascript
// src/Dashboard/Dashboard.jsx
export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to Dashboard</h1>
      {/* Your content */}
    </div>
  )
}
```

**What happens:**
1. File saved (Ctrl+S)
2. Vite detects change
3. File re-compiles
4. HMR sends update to browser
5. Component re-renders in browser
6. No page refresh needed!

### Step 3: Debug in Browser

**Open DevTools:**
- Press `F12` or `Ctrl+Shift+I`

**Console tab:**
```javascript
// Check stored auth data
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('role'))

// Check axios responses
// Errors from API calls appear here
```

**Network tab:**
- See all API requests
- Check headers, response bodies
- Verify authentication tokens

**React DevTools Extension:**
- Install "React Developer Tools" extension
- Inspect component hierarchy
- View state and props

### Step 4: Common Development Tasks

#### Add New Page

1. **Create component:**
```javascript
// src/NewPage/NewPage.jsx
export default function NewPage() {
  return <div>New Page Content</div>
}
```

2. **Add route in App.jsx:**
```javascript
import NewPage from './NewPage/NewPage.jsx'

<Route 
  path="/newpage" 
  element={<NewPage />} 
/>
```

3. **Add navigation link:**
```javascript
// In a navigation component
<Link to="/newpage">New Page</Link>
```

#### Add New API Call

1. **Create function:**
```javascript
const fetchData = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/endpoint`)
    setData(response.data)
  } catch (err) {
    setError(err.message)
  }
}
```

2. **Call in useEffect:**
```javascript
useEffect(() => {
  fetchData()
}, []) // Empty array = run once on mount
```

#### Fix Styling Issue

1. **Inspect element:** F12 → Elements tab → Click element
2. **Try Tailwind classes:** Edit directly in DevTools
3. **Copy working class:** `className="rounded-lg shadow-lg"`
4. **Paste in code:** Save and HMR updates

---

## Production Build

### Step 1: Create Optimized Build

```bash
npm run build
```

**Output:**
```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── main.[hash].js   # Bundled JavaScript
│   └── main.[hash].css  # Bundled CSS
└── assets/              # Images, fonts, etc.
```

**What happens:**
1. Vite bundles all components
2. Minifies JavaScript & CSS
3. Creates source maps for debugging
4. Optimizes images
5. Result: ~200KB total (highly compressed)

### Step 2: Preview Build Locally

```bash
npm run preview
```

**Simulates production build on local server**
- Lets you test before deployment
- Verify all pages work correctly
- Check network requests

### Step 3: Deploy to Server

**Option A: Deploy to Netlify (Easiest)**

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option B: Deploy to GitHub Pages**

```bash
# Update package.json homepage field
"homepage": "https://kevinmorri921.github.io/TektonWebsite"

npm run build
npm install -g gh-pages
gh-pages -d dist
```

**Option C: Deploy to Custom Server**

1. Build locally: `npm run build`
2. Upload `dist/` folder to server
3. Configure web server (nginx/Apache) to serve `dist/index.html`
4. Point domain to server

### Step 4: Environment Variables for Production

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Tekton Website
```

**Build will use these:**
```bash
npm run build
# Uses variables from .env.production
```

### Step 5: Monitor Production

**Check for errors:**
- Browser console (F12)
- Backend logs
- Error tracking service (Sentry, etc.)

**Common issues:**
- CORS errors → Check backend CORS config
- 404 on assets → Check dist/ folder structure
- API timeout → Check backend server health

---

## Summary

### Frontend is Complete With:

✅ **React 18** - Modern component-based UI
✅ **Vite** - Lightning-fast build tool
✅ **Tailwind CSS** - Beautiful styling
✅ **Axios** - HTTP requests
✅ **React Router** - Page navigation
✅ **Protected Routes** - Authentication security
✅ **Sign-out Logging** - NEW audit trail
✅ **Responsive Design** - Works on all devices
✅ **Error Handling** - Graceful failures
✅ **Development Experience** - Hot reload, debugging

### Frontend Supports:

✅ User registration (signup)
✅ User login with JWT
✅ User dashboard with markers & events
✅ User profile management
✅ User settings
✅ File upload with validation
✅ File download with integrity check
✅ User logout with event logging (NEW)
✅ Admin panel for user management
✅ Event log viewer with filtering
✅ Role-based access control

### To Get Started:

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Visit http://localhost:5173
# 4. Sign up or login
# 5. Explore all features
```

---

**Last Updated:** November 26, 2025
**Status:** ✅ Production Ready with Sign-Out Logging
**Frontend Version:** 1.0.0
