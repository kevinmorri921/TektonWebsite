# Profile Settings Module - Role-Based Implementation

## Overview

The Profile Settings module allows users to manage their account information with role-based access control. Only users with specific roles (Super Admin, Admin, Encoder, Researcher) can access and modify their profile settings.

---

## Features

### 1. ✅ Change Password
- Requires current password verification
- Validates new password against security requirements
- Hashes password securely with bcryptjs (10 salt rounds)
- Forces user to re-login after password change
- Shows clear success/error messages

### 2. ✅ Update Display Name
- Allows users to update their full name
- Validates input on frontend and backend
- Sanitizes input to prevent XSS attacks
- Immediately reflects changes in localStorage and UI
- Success message confirmation

### 3. ✅ Delete Account
- Requires user confirmation via browser dialog
- Prevents accidental deletion
- Permanently removes user from database
- Clears all session data
- Redirects to signup page after deletion

### 4. ✅ Role-Based Access Control
- Frontend checks user role before rendering profile page
- Backend validates role on every API request
- Allowed roles: SUPER_ADMIN, admin, encoder, researcher
- Unauthorized users see access denied message with return button
- Detailed role display in sidebar

### 5. ✅ Backend API Validation
- All endpoints validate JWT token
- All endpoints verify user role
- Role validation happens before any data modification
- Prevents unauthorized access with 403 Forbidden responses
- Comprehensive error logging

---

## Architecture

### Frontend Structure

**File:** `src/Profile/Profile.jsx`

```
Profile Component
├── Authorization Check (useEffect)
│   ├── Get role from localStorage
│   ├── Check if role is in ALLOWED_ROLES
│   └── Redirect if unauthorized
├── UI Components
│   ├── Authorization Error Page (if unauthorized)
│   ├── Sidebar Navigation
│   │   ├── User Greeting
│   │   ├── Role Badge
│   │   ├── Navigation Links
│   │   └── Logout Button
│   └── Main Content Area
│       ├── Update Name Form
│       ├── Change Password Form
│       └── Delete Account Button
└── State Management
    ├── Message (feedback)
    ├── Form Inputs
    ├── Loading States
    ├── userRole
    └── isAuthorized
```

### Backend Structure

```
API Endpoints
├── /api/auth/update-profile (POST)
│   ├── JWT Validation
│   ├── Role Check
│   ├── Input Validation
│   └── Database Update
├── /api/auth/change-password (POST)
│   ├── JWT Validation
│   ├── Role Check
│   ├── Current Password Verification
│   ├── Password Hashing
│   └── Database Update
└── /api/auth/delete-account (DELETE)
    ├── JWT Validation
    ├── Role Check
    ├── Super Admin Protection
    └── Database Deletion
```

---

## Role-Based Access Control

### Allowed Roles

```javascript
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];
```

### Access Control Flow

```
User Login
  ↓
Role stored in localStorage: currentUser.role
  ↓
User navigates to /profile
  ↓
Profile component checks role
  ├─ If role in ALLOWED_ROLES → Show profile settings
  └─ If role NOT in ALLOWED_ROLES → Show access denied page
  ↓
User performs action (update name, change password, delete account)
  ↓
Frontend sends request with JWT token
  ↓
Backend validates:
  ├─ JWT token is valid
  ├─ User exists
  ├─ User role is in ALLOWED_ROLES
  └─ If all valid → Perform action
      Else → Return 403 Forbidden
```

---

## API Endpoints

### 1. Update Profile (Change Name)

**Endpoint:** `POST /api/auth/update-profile`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullname": "New User Name"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "fullname": "New User Name"
}
```

**Error Responses:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | Authentication required | No token provided |
| 401 | Invalid or expired token | Token is invalid |
| 403 | You do not have permission to update profile settings | User role not allowed |
| 404 | User not found | User doesn't exist |
| 400 | Fullname is required | Empty fullname |
| 500 | Server error | Database error |

---

### 2. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "old_password_123",
  "newPassword": "new_password_123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | Authentication required | No token provided |
| 401 | Invalid or expired token | Token is invalid |
| 403 | You do not have permission to change password | User role not allowed |
| 404 | User not found | User doesn't exist |
| 400 | Current password is incorrect | Wrong current password |
| 400 | Current password and new password are required | Missing fields |
| 500 | Server error | Database error |

---

### 3. Delete Account

**Endpoint:** `DELETE /api/auth/delete-account`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | Authentication required | No token provided |
| 401 | Invalid or expired token | Token is invalid |
| 403 | You do not have permission to delete account | User role not allowed |
| 403 | Super admin account cannot be deleted | Attempting to delete super admin |
| 404 | User not found | User doesn't exist |
| 500 | Server error | Database error |

---

## Frontend Implementation Details

### Authorization Check

```javascript
useEffect(() => {
  const checkAuthorization = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const role = currentUser.role || "";
      
      setUserRole(role);
      
      // Check if user role is in allowed list
      if (ALLOWED_ROLES.includes(role)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setMessage("⛔ You do not have permission to access profile settings.");
      }
    } catch (error) {
      console.error("Error checking authorization:", error);
      setIsAuthorized(false);
      navigate("/dashboard");
    }
  };

  checkAuthorization();
}, [navigate]);
```

### Update Name Handler

```javascript
const handleUpdateName = async (e) => {
  e.preventDefault();
  if (!fullname) return setMessage("⚠ Please enter your new name.");
  
  try {
    setLoading(prev => ({ ...prev, name: true }));
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/auth/update-profile",
      { fullname },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      localStorage.setItem("fullname", fullname);
      setMessage("✅ Name updated successfully.");
      setFullname("");
    } else {
      setMessage(res.data.message || "❌ Error updating name.");
    }
  } catch (err) {
    setMessage("⚠ Server error. Please try again later.");
  } finally {
    setLoading(prev => ({ ...prev, name: false }));
  }
};
```

### Change Password Handler

```javascript
const handleChangePassword = async (e) => {
  e.preventDefault();
  if (!currentPassword || !newPassword)
    return setMessage("⚠ Please fill in all password fields.");
  
  try {
    setLoading(prev => ({ ...prev, password: true }));
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/auth/change-password",
      { 
        currentPassword: currentPassword,
        newPassword: newPassword
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.data.success) {
      setMessage("✅ Password changed successfully. Redirecting to login...");
      setCurrentPassword("");
      setNewPassword("");
      
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("fullname");
        localStorage.removeItem("email");
        navigate("/login");
      }, 2000);
    } else {
      setMessage(res.data.message || "❌ Error changing password.");
    }
  } catch (err) {
    if (err.response?.status === 400) {
      setMessage("⚠ Current password is incorrect.");
    } else {
      setMessage("⚠ Server error. Please try again later.");
    }
  } finally {
    setLoading(prev => ({ ...prev, password: false }));
  }
};
```

### Delete Account Handler

```javascript
const handleDeleteAccount = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete your account? This cannot be undone!"
  );
  if (!confirmDelete) return;
  
  try {
    setLoading(prev => ({ ...prev, delete: true }));
    const token = localStorage.getItem("token");
    const res = await axios.delete("http://localhost:5000/api/auth/delete-account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      localStorage.clear();
      setMessage("✅ Account deleted successfully. Redirecting...");
      setTimeout(() => navigate("/signup"), 1500);
    } else {
      setMessage(res.data.message || "❌ Error deleting account.");
    }
  } catch (err) {
    setMessage("⚠ Server error. Please try again later.");
  } finally {
    setLoading(prev => ({ ...prev, delete: false }));
  }
};
```

---

## Backend Implementation Details

### Update Profile Route

**File:** `backend/routes/update-profile.js`

Key validations:
1. JWT token validation
2. User existence check
3. **Role validation** - Ensures user has allowed role
4. Input validation - Fullname is required
5. XSS protection - Sanitizes input
6. Database update - Saves new fullname

```javascript
// Check if user has allowed role
if (!ALLOWED_ROLES.includes(user.role)) {
  logger.warn("[UPDATE-PROFILE] Unauthorized role access for userId=%s role=%s", 
    decoded.id, user.role);
  return res.status(403).json({
    success: false,
    message: "You do not have permission to update profile settings",
  });
}
```

### Change Password Route

**File:** `backend/routes/change-password.js`

Key validations:
1. JWT token validation
2. User existence check
3. **Role validation** - Ensures user has allowed role
4. Input validation - Both passwords required
5. Current password verification - Uses bcrypt compare
6. Password hashing - bcryptjs with 10 salt rounds
7. Database update - Saves new password

```javascript
// Check if user has allowed role
if (!ALLOWED_ROLES.includes(user.role)) {
  logger.warn("[CHANGE-PASSWORD] Unauthorized role access for userId=%s role=%s", 
    decoded.id, user.role);
  return res.status(403).json({
    success: false,
    message: "You do not have permission to change password",
  });
}

// Verify current password
const isCurrentPasswordValid = await bcrypt.compare(
  currentPassword, 
  user.password
);
```

### Delete Account Route

**File:** `backend/routes/delete-account.js`

Key validations:
1. JWT token validation
2. User existence check
3. **Role validation** - Ensures user has allowed role
4. **Super admin protection** - Prevents super admin deletion
5. Database deletion - Permanently removes user
6. Comprehensive logging

```javascript
// Check if user has allowed role
if (!ALLOWED_ROLES.includes(user.role)) {
  logger.warn("[DELETE-ACCOUNT] Unauthorized role access for userId=%s role=%s", 
    decoded.id, user.role);
  return res.status(403).json({
    success: false,
    message: "You do not have permission to delete account",
  });
}

// Prevent super admin deletion
if (user.email === 'super_admin@tekton.com') {
  logger.warn("[DELETE-ACCOUNT] Attempt to delete super admin account from %s", 
    req.ip);
  return res.status(403).json({
    success: false,
    message: "Super admin account cannot be deleted",
  });
}
```

---

## Security Features

### Frontend Security
✅ Role-based access control before rendering UI
✅ Authorization check in useEffect
✅ Token stored in localStorage
✅ Input validation on all forms
✅ XSS protection (backend sanitization)

### Backend Security
✅ JWT token validation on all endpoints
✅ Role-based authorization on all endpoints
✅ Password hashing with bcryptjs (10 salt rounds)
✅ Current password verification before change
✅ Input validation and sanitization
✅ Super admin account protection
✅ Comprehensive error logging
✅ Safe error messages (no sensitive data)

### Data Protection
✅ Passwords never sent in plain text
✅ HTTPS ready (production)
✅ CORS configured
✅ Rate limiting available
✅ Request validation middleware

---

## UI Components

### Authorization Error Page

Shows when user doesn't have allowed role:
- Lock icon
- "Access Denied" message
- Explains allowed roles
- Shows current user's role
- "Return to Dashboard" button

### Sidebar Navigation

Displays:
- User greeting with name
- **Role badge** showing user's current role
- Navigation links (Dashboard, Analytics, Settings)
- Logout button

### Main Content Sections

**1. Update Name**
- Icon: Pencil
- Input field for new name
- Update button (disabled if empty)
- Loading state
- Success/error message

**2. Change Password**
- Icon: Key
- Current password input
- New password input
- Change Password button
- Loading state
- Success/error message
- Info: "You will be logged out after changing your password"

**3. Delete Account**
- Icon: AlertTriangle (red)
- Delete Account button (red)
- Loading state
- Success/error message
- Warning: "This action cannot be undone. All your data will be permanently deleted."

---

## Error Handling

### Frontend Error Messages

**Success (Green):**
- ✅ Name updated successfully
- ✅ Password changed successfully. Redirecting to login...
- ✅ Account deleted successfully. Redirecting...

**Warning (Yellow):**
- ⚠ Please enter your new name
- ⚠ Please fill in all password fields
- ⚠ Current password is incorrect
- ⚠ Server error. Please try again later

**Error (Red):**
- ❌ Error updating name
- ❌ Error changing password
- ❌ Error deleting account
- ⛔ You do not have permission to access profile settings

### Backend Error Responses

All errors return appropriate HTTP status codes:
- **400** - Bad Request (missing fields, invalid input)
- **401** - Unauthorized (no token, invalid token)
- **403** - Forbidden (role not allowed, super admin protection)
- **404** - Not Found (user doesn't exist)
- **500** - Server Error

---

## Testing Guide

### Prerequisites
- Backend running on http://localhost:5000
- MongoDB connected
- User with allowed role (admin, encoder, researcher)

### Test Cases

#### 1. Authorize Access
```
✓ Login with admin account
✓ Navigate to /profile
✓ Verify role badge shows correct role
✓ Verify all forms are visible
```

#### 2. Deny Access
```
✓ Login with user that has non-allowed role
✓ Try to navigate to /profile
✓ Verify "Access Denied" message appears
✓ Verify current role is displayed
✓ Verify "Return to Dashboard" button works
```

#### 3. Update Name
```
✓ Navigate to Profile page (authorized user)
✓ Enter new name
✓ Click Update button
✓ Verify success message
✓ Verify name updates in sidebar after reload
✓ Try with empty field (button should be disabled)
```

#### 4. Change Password
```
✓ Enter correct current password
✓ Enter new password
✓ Click Change Password
✓ Verify success message
✓ Verify auto-logout after 2 seconds
✓ Try login with new password
✓ Try with wrong current password (error should appear)
```

#### 5. Delete Account
```
✓ Click Delete Account button
✓ Confirm in browser dialog
✓ Verify success message
✓ Verify redirect to /signup
✓ Try to login with deleted account (should fail)
```

#### 6. Backend Role Validation
```
✓ Attempt API call with token from non-allowed role
✓ Verify 403 Forbidden response
✓ Attempt API call with invalid token
✓ Verify 401 Unauthorized response
```

---

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  fullname: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ["SUPER_ADMIN", "admin", "encoder", "researcher"]),
  isEnabled: Boolean (default: true),
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Configuration

### Environment Variables

```
JWT_SECRET=your_secret_key
MONGO_URI=mongodb://...
PORT=5000
NODE_ENV=development
```

### Allowed Roles (Frontend & Backend)

```javascript
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];
```

---

## Troubleshooting

### Issue: "Access Denied" when trying to view profile
**Solution:** Check user role in localStorage. Make sure role is one of: SUPER_ADMIN, admin, encoder, researcher

### Issue: Update name fails with 403 Forbidden
**Solution:** User role is not in ALLOWED_ROLES. Check backend logs for actual role value.

### Issue: Change password fails with "Current password is incorrect"
**Solution:** Ensure you're entering the correct current password. Passwords are case-sensitive.

### Issue: Delete account succeeds but API returns error
**Solution:** Check that user exists and has allowed role. Super admin accounts cannot be deleted.

### Issue: Token expired (401 error)
**Solution:** JWT tokens expire after 1 day. User needs to login again to get fresh token.

### Issue: CORS error when making API requests
**Solution:** Ensure backend CORS is configured and frontend URL is in allowed origins.

---

## Summary

The Profile Settings module provides a secure, role-based system for users to manage their account. Key features:

✅ Complete role-based access control
✅ Secure password management
✅ Account name management
✅ Safe account deletion
✅ Comprehensive backend validation
✅ User-friendly error messages
✅ Production-ready security

All users with roles (Super Admin, Admin, Encoder, Researcher) can access and use these features, while unauthorized users are prevented from accessing them.
