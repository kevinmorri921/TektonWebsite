# ✅ Frontend-Backend Communication Setup Complete

## Current Status

### Backend Server ✅
- **Status**: Running on `http://localhost:5000`
- **Environment**: Development
- **Database**: Connected to MongoDB Atlas
- **CORS**: Configured for localhost
- **Security**: All middleware active

### Configuration ✅
- **Node Environment**: development
- **ALLOWED_ORIGINS**: http://localhost:5173, http://localhost:3000, http://127.0.0.1:5173
- **Password Requirements**: Uppercase + Lowercase + Number + Special Character

### Super Admin User ✅
- **Email**: `super_admin@tekton.com`
- **Password**: `SuperAdmin@2024`
- **Status**: Created in MongoDB

---

## How to Use

### 1. Start Frontend (Vite Dev Server)
```bash
# In project root
npm run dev
# Should start on http://localhost:5173
```

### 2. Login with Super Admin
- **URL**: http://localhost:5173/login
- **Email**: `super_admin@tekton.com`
- **Password**: `SuperAdmin@2024`
- Should redirect to admin panel after successful login

### 3. Create New Users
- **URL**: http://localhost:5173/signup
- **Password must have**:
  - At least 8 characters
  - Uppercase letter (A-Z)
  - Lowercase letter (a-z)
  - Number (0-9)
  - Special character (@$!%*?&)

**Example passwords that work:**
- `MyPass@123`
- `Test@1234`
- `Secure#2024`
- `Demo@Pass99`

---

## Troubleshooting

### Issue: "Can't connect to backend"
**Solution**: Check that backend is running
```bash
# In backend folder
node server.js
# Should show: 🚀 Server running on http://localhost:5000
```

### Issue: "CORS error in console"
**Solution**: Backend is running but frontend origin not in ALLOWED_ORIGINS
- Make sure frontend is on http://localhost:5173
- Check .env ALLOWED_ORIGINS variable

### Issue: "Password validation failed"
**Solution**: Password doesn't meet requirements
- Must have uppercase letter
- Must have lowercase letter
- Must have number
- Must have special character (@$!%*?&)
- Minimum 8 characters

### Issue: "User already exists"
**Solution**: Try signup with different email address
- Email must be unique in database
- Try: `user+timestamp@example.com`

### Issue: "Login failed - user not found"
**Solution**: User doesn't exist in database
- Make sure you signed up first OR
- Use super admin: `super_admin@tekton.com` / `SuperAdmin@2024`

---

## API Endpoints

### POST /api/signup
Create new user account
```json
Request body:
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "MyPass@123",
  "confirmPassword": "MyPass@123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "role": "researcher"
  }
}
```

### POST /api/login
Login with email and password
```json
Request body:
{
  "email": "john@example.com",
  "password": "MyPass@123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "fullname": "John Doe",
  "role": "researcher"
}
```

---

## What Was Fixed

### 1. Super Admin Password
- ✅ Updated from `admin123` to `SuperAdmin@2024`
- ✅ Now meets security requirements

### 2. Environment Configuration
- ✅ Added ALLOWED_ORIGINS to .env
- ✅ Added security configuration variables
- ✅ Frontend can now communicate with backend

### 3. CORS Configuration
- ✅ Development mode allows localhost:5173
- ✅ Properly handles preflight requests
- ✅ Sets correct headers

### 4. Scripts
- ✅ Fixed createSuperAdmin.js to load .env first
- ✅ Now properly creates super admin account

---

## Files Modified

1. **backend/.env**
   - Added ALLOWED_ORIGINS
   - Added security configuration variables

2. **backend/scripts/createSuperAdmin.js**
   - Updated password to SuperAdmin@2024
   - Added dotenv.config() at top

3. **backend/server.js**
   - Already had proper CORS middleware
   - Already had proper route registration

4. **FRONTEND_BACKEND_TROUBLESHOOTING.md** (New)
   - Comprehensive troubleshooting guide

---

## Verification Commands

### Check Backend is Running:
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","uptime":...}
```

### Test Signup Endpoint:
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"fullname":"Test","email":"test@example.com","password":"Test@1234","confirmPassword":"Test@1234"}'
```

### Test Login Endpoint:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"super_admin@tekton.com","password":"SuperAdmin@2024"}'
```

---

## Next Steps

1. **Start Backend** (if not running):
   ```bash
   cd backend && node server.js
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Navigate to**:
   ```
   http://localhost:5173/login
   ```

4. **Login with**:
   - Email: `super_admin@tekton.com`
   - Password: `SuperAdmin@2024`

5. **Test Signup**:
   - Go to signup page
   - Create new account with valid password
   - Should redirect to login after success

---

## Important Notes

- ✅ Backend must be running for frontend to work
- ✅ Frontend must be on localhost:5173 (or update ALLOWED_ORIGINS)
- ✅ All passwords must meet security requirements
- ✅ Super admin account is for testing only
- ✅ Remove debug info before production deployment

---

**Status**: ✅ Ready for Use

**Last Updated**: November 20, 2025
