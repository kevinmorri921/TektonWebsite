# Complete API Specifications & Reference

## Authentication Endpoints

### POST /api/auth/login
**Description:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "user@example.com",
    "role": "researcher",
    "isAdmin": false
  },
  "expiresIn": "1d"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid email or password"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "User not enabled or does not exist"
}
```

---

### POST /api/auth/signup
**Description:** Create new user account

**Request:**
```json
{
  "fullname": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "fullname": "Jane Smith",
    "email": "jane@example.com",
    "role": "researcher"
  }
}
```

**Response (409 Conflict):**
```json
{
  "error": "Email already registered"
}
```

---

### POST /api/logout
**Description:** Sign out user and log event

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Token not provided or invalid"
}
```

---

## User Management Endpoints

### GET /api/users
**Description:** Get all users (admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response (200 OK):**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "fullname": "John Doe",
      "email": "john@example.com",
      "role": "researcher",
      "isEnabled": true,
      "createdAt": "2025-01-10T12:00:00Z",
      "lastLoginAt": "2025-01-15T09:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

### GET /api/users/:id
**Description:** Get specific user details

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id`: User ObjectId

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullname": "John Doe",
  "email": "john@example.com",
  "role": "researcher",
  "isAdmin": false,
  "isEnabled": true,
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-01-15T09:30:00Z"
}
```

---

### PUT /api/users/profile
**Description:** Update own profile

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "fullname": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullname": "John Smith",
    "email": "john.smith@example.com",
    "role": "researcher"
  }
}
```

---

### POST /api/users/change-password
**Description:** Change user password

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Current password is incorrect"
}
```

---

### DELETE /api/users/:id
**Description:** Delete user account (admin or self)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

---

## Marker Endpoints

### POST /api/markers
**Description:** Upload new marker with file

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (string, required): Marker title
- `description` (string, optional): Marker description
- `latitude` (number, required): -90 to 90
- `longitude` (number, required): -180 to 180
- `file` (binary, required): File to upload (max 10MB)

**Response (201 Created):**
```json
{
  "marker": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Forest Survey Site A",
    "description": "Initial assessment survey",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "fileName": "survey_forest_a_2025.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "activityLog": {
    "_id": "507f1f77bcf86cd799439020",
    "action": "Uploaded Marker",
    "details": "survey_forest_a_2025.pdf"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid file type. Allowed: image/jpeg, image/png, application/pdf, text/csv, application/json"
}
```

**Response (413 Payload Too Large):**
```json
{
  "error": "File size exceeds maximum of 10MB"
}
```

---

### GET /api/markers
**Description:** Get user's markers

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `sortBy` (optional): createdAt, uploadedAt, title

**Response (200 OK):**
```json
{
  "markers": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "title": "Forest Survey Site A",
      "description": "Initial assessment survey",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "fileName": "survey_forest_a_2025.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/markers/:id/download
**Description:** Download marker file

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
- File binary content
- Header: `Content-Disposition: attachment; filename="survey_forest_a_2025.pdf"`

**Response (404 Not Found):**
```json
{
  "error": "Marker or file not found"
}
```

---

### DELETE /api/markers/:id
**Description:** Delete marker and associated file

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Marker deleted successfully",
  "activityLog": {
    "_id": "507f1f77bcf86cd799439021",
    "action": "Deleted Marker",
    "details": "survey_forest_a_2025.pdf"
  }
}
```

---

## Event Endpoints

### POST /api/events
**Description:** Create new event linked to marker

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "markerId": "507f1f77bcf86cd799439013",
  "title": "Forest Fire Assessment",
  "description": "Investigate potential fire damage",
  "date": "2025-02-01T09:00:00Z",
  "priority": "high",
  "status": "planned"
}
```

**Response (201 Created):**
```json
{
  "event": {
    "_id": "507f1f77bcf86cd799439022",
    "markerId": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Forest Fire Assessment",
    "description": "Investigate potential fire damage",
    "date": "2025-02-01T09:00:00Z",
    "priority": "high",
    "status": "planned",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "activityLog": {
    "_id": "507f1f77bcf86cd799439023",
    "action": "Created Survey"
  }
}
```

---

### GET /api/events
**Description:** Get user's events

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `markerId` (optional): Filter by marker
- `status` (optional): planned, ongoing, completed, cancelled
- `priority` (optional): low, medium, high, critical

**Response (200 OK):**
```json
{
  "events": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "markerId": "507f1f77bcf86cd799439013",
      "title": "Forest Fire Assessment",
      "date": "2025-02-01T09:00:00Z",
      "priority": "high",
      "status": "planned",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 12,
  "filtered": 5
}
```

---

### PUT /api/events/:id
**Description:** Update event

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Forest Fire Assessment - Updated",
  "status": "ongoing",
  "priority": "critical"
}
```

**Response (200 OK):**
```json
{
  "event": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Forest Fire Assessment - Updated",
    "status": "ongoing",
    "priority": "critical",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "activityLog": {
    "_id": "507f1f77bcf86cd799439024",
    "action": "Updated Survey"
  }
}
```

---

## Activity Log Endpoints

### GET /api/activitylog
**Description:** Get activity logs (admin only)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 500)
- `action` (optional): Filter by action type
- `email` (optional): Filter by user email
- `role` (optional): Filter by user role
- `startDate` (optional): ISO 8601 format
- `endDate` (optional): ISO 8601 format

**Response (200 OK):**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "username": "john_doe",
      "email": "john@example.com",
      "action": "Uploaded Marker",
      "role": "researcher",
      "ipAddress": "192.168.1.1",
      "details": "survey_forest_a_2025.pdf",
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 50,
  "pages": 25
}
```

---

### GET /api/activitylog/export
**Description:** Export activity logs as CSV

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `format` (optional): csv, json (default: csv)
- `action` (optional): Filter by action
- `startDate` (optional): ISO 8601
- `endDate` (optional): ISO 8601

**Response (200 OK):**
- CSV file download with headers: Date, Username, Email, Role, Action, Details, IP Address

---

## Admin Endpoints

### GET /api/admin/dashboard
**Description:** Get dashboard statistics

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**
```json
{
  "stats": {
    "totalUsers": 150,
    "activeUsers": 87,
    "newUsersToday": 3,
    "totalMarkers": 450,
    "totalEvents": 320,
    "storageUsed": "15.2 GB"
  },
  "recentActivity": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "user": "john@example.com",
      "action": "Uploaded Marker",
      "details": "survey_forest_a_2025.pdf"
    }
  ]
}
```

---

### PUT /api/admin/users/:id/role
**Description:** Update user role

**Headers:**
```
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "message": "User role updated",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### PUT /api/admin/users/:id/status
**Description:** Enable/disable user

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "isEnabled": false
}
```

**Response (200 OK):**
```json
{
  "message": "User status updated",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "isEnabled": false
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/markers",
  "method": "POST"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input validation |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists |
| 413 | Payload Too Large | File exceeds 10MB |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | DB connection failed |

---

## Rate Limiting

```
Endpoint Groups:
├─ Authentication: 5 requests per 15 minutes per IP
├─ File Upload: 10 requests per hour per user
├─ API General: 100 requests per 15 minutes per IP
└─ Admin: 50 requests per 15 minutes per admin

Header Responses:
├─ X-RateLimit-Limit: 100
├─ X-RateLimit-Remaining: 87
└─ X-RateLimit-Reset: 1705318200

When Exceeded (429):
{
  "error": "Too many requests",
  "retryAfter": 45
}
```

---

## Authentication Token Format

**JWT Structure:**
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "fullname": "John Doe",
  "role": "researcher",
  "isAdmin": false,
  "iat": 1705280400,
  "exp": 1705366800
}

Signature:
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

**Token Usage:**
```javascript
// Every authenticated request
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

**Token Validation:**
- Must be present in Authorization header
- Must be valid JWT format
- Signature must match server secret
- Must not be expired (exp claim checked)
- Must have valid user in database

---

**Document Version:** 1.0  
**Date:** November 25, 2025  
**Status:** API Reference Complete
