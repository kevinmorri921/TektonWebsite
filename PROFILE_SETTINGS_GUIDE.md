# Profile Settings Module - Complete Implementation Guide

## Overview
This document provides a comprehensive guide to the Profile Settings module, which allows users to manage their account including:
- Updating their full name
- Changing their password securely
- Deleting their account with confirmation

---

## Table of Contents
1. [Frontend Implementation](#frontend-implementation)
2. [Backend Implementation](#backend-implementation)
3. [API Endpoints](#api-endpoints)
4. [Validation & Security](#validation--security)
5. [Error Handling](#error-handling)
6. [Testing Guide](#testing-guide)

---

## Frontend Implementation

### File: `src/Profile/Profile.jsx`

The Profile component is a complete React component that provides:
- Sidebar navigation
- Three main sections: Update Name, Change Password, Delete Account
- Real-time validation and feedback
- Loading states for all operations

#### Key Features:

**1. State Management**
```javascript
const [message, setMessage] = useState("");           // Feedback messages
const [fullname, setFullname] = useState("");         // Name update input
const [currentPassword, setCurrentPassword] = useState("");  // Current password
const [newPassword, setNewPassword] = useState("");   // New password
const [loading, setLoading] = useState({
  name: false,
  password: false,
  delete: false
});
```

**2. Update Name Function**
- Validates input is not empty
- Sends POST request to `/api/auth/update-profile`
- Updates localStorage fullname on success
- Shows success/error messages
- Clears input after successful update

**3. Change Password Function**
- Validates both current and new passwords are provided
- Sends POST request to `/api/auth/change-password`
- Logs user out and redirects to login after successful change
- Shows appropriate error for incorrect current password
- Clears sensitive fields after submission

**4. Delete Account Function**
- Shows browser confirmation dialog
- Sends DELETE request to `/api/auth/delete-account`
- Clears all localStorage data
- Redirects to signup page after successful deletion

#### Styling Details:

**Layout:**
- Responsive design using Tailwind CSS
- Light theme with `#F8F9FA` background
- Dark sidebar with navigation buttons
- Grid layout for form sections (2 columns on large screens)

**Colors:**
- Primary text: `#303345` (dark blue-gray)
- Secondary text: `#14142B` (almost black)
- Success: Green shades
- Error: Red shades  
- Warning: Yellow shades
- Background: `#F8F9FA` (light gray)

**Components:**
- Lucide React icons (Pencil, Key, Trash2, AlertTriangle, Home, etc.)
- Framer Motion for animations
- Border styling with `border-gray-200`
- Rounded cards with `rounded-2xl` and shadow effects

---

## Backend Implementation

### Route Files Structure:

#### 1. **`backend/routes/update-profile.js`** - Update Full Name

```javascript
// POST /api/auth/update-profile
// Headers: Authorization: Bearer {token}
// Body: { fullname: "New Name" }

Features:
- JWT token validation
- Input validation and sanitization (XSS protection)
- Database update
- Success response with updated fullname
- Comprehensive error handling

Error Cases:
- 401: No token provided or invalid token
- 400: Missing fullname
- 404: User not found
- 500: Server error
```

#### 2. **`backend/routes/change-password.js`** - Change Password

```javascript
// POST /api/auth/change-password
// Headers: Authorization: Bearer {token}
// Body: { currentPassword: "...", newPassword: "..." }

Features:
- JWT token validation
- Verify current password against database (bcrypt)
- Hash new password (bcryptjs, 10 salt rounds)
- Database update
- Input validation (password strength requirements)

Error Cases:
- 401: No token or invalid token
- 400: Missing passwords or incorrect current password
- 404: User not found
- 500: Server error
```

#### 3. **`backend/routes/delete-account.js`** - Delete Account

```javascript
// DELETE /api/auth/delete-account
// Headers: Authorization: Bearer {token}

Features:
- JWT token validation
- Permanent user deletion from database
- Comprehensive logging
- Success confirmation

Error Cases:
- 401: No token or invalid token
- 404: User not found
- 500: Server error
```

#### 4. **`backend/routes/auth.js`** - User Registration

```javascript
// POST /api/signup
// Body: { fullname, email, password, role }

Features:
- Check for existing user (email uniqueness)
- Hash password with bcryptjs (10 salt rounds)
- Validate and assign role
- XSS protection on inputs
- Comprehensive logging

Supported Roles:
- SUPER_ADMIN
- admin
- encoder
- researcher (default)
```

#### 5. **`backend/routes/login.js`** - User Login

```javascript
// POST /api/login
// Body: { email, password }

Features:
- User lookup and authentication
- Password verification with bcrypt
- Account status check (isEnabled)
- Activity logging
- JWT token generation
- Return user role and fullname

Response:
{
  success: true,
  token: "jwt_token",
  fullname: "User Name",
  role: "researcher|admin|SUPER_ADMIN"
}
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/signup` | Register new account | No |
| POST | `/api/login` | Login to account | No |
| POST | `/api/auth/update-profile` | Update full name | YES (Bearer Token) |
| POST | `/api/auth/change-password` | Change password | YES (Bearer Token) |
| DELETE | `/api/auth/delete-account` | Delete account | YES (Bearer Token) |

### Request/Response Examples

**Update Profile:**
```bash
curl -X POST http://localhost:5000/api/auth/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"fullname":"New Name"}'

# Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "fullname": "New Name"
}
```

**Change Password:**
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"currentPassword":"oldpass","newPassword":"newpass"}'

# Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Delete Account:**
```bash
curl -X DELETE http://localhost:5000/api/auth/delete-account \
  -H "Authorization: Bearer {token}"

# Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Validation & Security

### Frontend Validation
- **Empty field checks**: Required fields must not be empty
- **Input trimming**: All inputs are trimmed before submission
- **Client-side feedback**: Real-time validation messages
- **Disabled states**: Submit buttons disable during loading or invalid state

### Backend Validation

**Input Validation Middleware (`middleware/validation.js`):**
```javascript
- Email: Valid email format, max 255 characters
- Password: Min 8 characters, complexity requirements
- Fullname: Min 1, max 100 characters
- Role: Must be in allowed enum values
```

**XSS Protection:**
```javascript
sanitizeInput.removeXSS(input)  // Removes malicious scripts
```

**Password Security:**
```javascript
- Hashed with bcryptjs (10 salt rounds)
- Never stored in plain text
- Current password verified before change
- User forced to re-login after password change
```

**Token Security:**
- JWT with 1-day expiration
- Bearer token required for authenticated endpoints
- Token validated on every request
- Invalid/expired tokens rejected with 401 status

---

## Error Handling

### Frontend Error Messages

**Success Messages (Green):**
- ✅ Name updated successfully
- ✅ Password changed successfully
- ✅ Account deleted successfully

**Warning Messages (Yellow):**
- ⚠ Please enter your new name
- ⚠ Please fill in all password fields
- ⚠ Current password is incorrect
- ⚠ Server error. Please try again later

**Error Messages (Red):**
- ❌ Error updating name
- ❌ Error changing password
- ❌ Error deleting account

### Backend Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required" or "Invalid or expired token"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Current password is incorrect" or "Fullname is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Server error. Please try again later."
}
```

---

## Data Flow

### Update Name Flow:
```
User Input → Frontend Validation → localStorage token retrieval
→ POST /api/auth/update-profile → Backend JWT validation
→ Input validation & sanitization → Database update
→ Response with updated name → Frontend updates UI & localStorage
→ Success message display
```

### Change Password Flow:
```
User Input → Frontend validation → localStorage token retrieval
→ POST /api/auth/change-password → Backend JWT validation
→ Input validation → Current password verification
→ Hash new password → Database update
→ Frontend clears localStorage → Redirect to /login
→ Success message before redirect
```

### Delete Account Flow:
```
User confirmation → localStorage token retrieval
→ DELETE /api/auth/delete-account → Backend JWT validation
→ Database deletion (permanent)
→ Frontend clears all localStorage
→ Redirect to /signup with success message
```

---

## Testing Guide

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on development server
- MongoDB connected
- Valid JWT token in localStorage

### Manual Testing Steps

**1. Test Update Name:**
1. Navigate to Profile page
2. Enter new name in "Update Name" section
3. Click "Update" button
4. Verify success message appears
5. Check localStorage fullname is updated
6. Verify name displays in sidebar after page reload

**2. Test Change Password:**
1. Navigate to Profile page
2. Enter current password (must be correct)
3. Enter new password
4. Click "Change Password" button
5. Verify success message
6. Verify user is logged out automatically
7. Attempt login with new password
8. Verify login succeeds with new password

**3. Test Delete Account:**
1. Navigate to Profile page
2. Click "Delete Account" button
3. Confirm in browser dialog
4. Verify success message
5. Verify redirect to signup page
6. Verify account is completely deleted (cannot login)

**4. Test Error Cases:**
1. Change Password with wrong current password → Should show error
2. Update Name with empty field → Button should be disabled
3. Network error simulation → Should handle gracefully
4. Expired token → Should redirect to login

### API Testing with cURL

```bash
# Get JWT token from login
TOKEN="your_jwt_token_here"

# Test update profile
curl -X POST http://localhost:5000/api/auth/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fullname":"Test User"}'

# Test change password
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"oldpass","newPassword":"newpass123"}'

# Test delete account
curl -X DELETE http://localhost:5000/api/auth/delete-account \
  -H "Authorization: Bearer $TOKEN"
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
  role: String (enum: ["SUPER_ADMIN", "admin", "encoder", "researcher"], default: "researcher"),
  isAdmin: Boolean (default: false),
  isEnabled: Boolean (default: true),
  lastLoginAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Security Best Practices Implemented

✅ **Authentication:**
- JWT-based token authentication
- Bearer token required for protected endpoints
- Token expiration (1 day)

✅ **Password Security:**
- Passwords hashed with bcryptjs (10 rounds)
- Current password verification required
- Never stored or transmitted in plain text

✅ **Input Security:**
- XSS protection with input sanitization
- Email format validation
- Password complexity requirements
- Input length validation

✅ **Error Handling:**
- Safe error messages (no sensitive data leaked)
- Development mode shows detailed errors
- Production mode shows generic messages

✅ **Database Security:**
- Unique email constraint
- Account status validation (isEnabled)
- Permanent deletion on request

✅ **Request Security:**
- CORS configured
- Rate limiting available
- Request size limits
- Security headers middleware

---

## Environment Variables Required

```
JWT_SECRET=your_secure_secret_key
MONGO_URI=mongodb://connection_string
PORT=5000
NODE_ENV=development
```

---

## Troubleshooting

### Issue: Update Profile gives 401 error
**Solution:** Verify JWT token is valid and not expired. Token expires after 1 day.

### Issue: Change Password fails with "Current password is incorrect"
**Solution:** Ensure you're entering the correct current password. Passwords are case-sensitive.

### Issue: Delete Account succeeds but user can still login
**Solution:** Clear browser localStorage and cookies. Login should fail with "User not found".

### Issue: Profile page not loading
**Solution:** Verify you're logged in and have valid token in localStorage at key "token".

### Issue: Backend routes return 404
**Solution:** Verify all routes are registered in `server.js` and backend is running on correct port (default 5000).

---

## Future Enhancements

Potential improvements for the Profile Settings module:

1. **Email Verification:**
   - Send verification email before enabling new email
   - Implement email change functionality

2. **Two-Factor Authentication:**
   - Optional 2FA setup in profile settings
   - Security codes or authenticator app support

3. **Session Management:**
   - View active sessions
   - Logout from other devices
   - Session history

4. **Account Recovery:**
   - Backup codes for account recovery
   - Password reset via email
   - Security questions

5. **Activity Log:**
   - View login history
   - Track profile changes
   - Monitor suspicious activity

6. **Preferences:**
   - Theme selection (dark/light mode)
   - Language preferences
   - Notification settings

---

## Summary

The Profile Settings module provides a secure, user-friendly way for users to manage their account. All operations are fully validated on both frontend and backend, with proper error handling and security measures in place.

The implementation follows best practices including:
- JWT authentication
- Password hashing with bcryptjs
- XSS protection
- Comprehensive error handling
- Clear user feedback
- Responsive design
- Activity logging

For questions or issues, refer to the troubleshooting section or check server logs for detailed error information.
