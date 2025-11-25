# System Diagrams - Technical Deep Dive

## Expanded ERD with Detailed Attributes

### Complete Entity Model

```
╔════════════════════════════════════════╗
║          USER COLLECTION               ║
╠════════════════════════════════════════╣
║ PK  _id: ObjectId                      ║
║     fullname: String                   ║
║ U   email: String                      ║
║     password: String (bcrypt)          ║
║     role: Enum                         ║
║     ├─ SUPER_ADMIN                     ║
║     ├─ admin                           ║
║     ├─ encoder                         ║
║     └─ researcher (default)            ║
║     isAdmin: Boolean (legacy)          ║
║     lastLoginAt: Date | null           ║
║     isEnabled: Boolean (true)          ║
║     createdAt: Date (auto)             ║
║     updatedAt: Date (auto)             ║
║                                        ║
║ Indexes:                               ║
║   • email (unique)                     ║
║   • role                               ║
║   • createdAt desc                     ║
║   • isEnabled                          ║
╚════════════════════════════════════════╝
         │
         │ 1:N Relationship
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼

╔════════════════════════════════════════╗  ╔════════════════════════════════════════╗
║       MARKER COLLECTION                ║  ║    ACTIVITYLOG COLLECTION              ║
╠════════════════════════════════════════╣  ╠════════════════════════════════════════╣
║ PK  _id: ObjectId                      ║  ║ PK  _id: ObjectId                      ║
║ FK  userId: ObjectId → User._id        ║  ║     username: String                   ║
║     title: String                      ║  ║     email: String (lowercase)          ║
║     description: String | null         ║  ║     action: Enum                       ║
║     latitude: Number (-90 to 90)       ║  ║     ├─ Login                           ║
║     longitude: Number (-180 to 180)    ║  ║     ├─ Sign Out                        ║
║     fileHash: String (SHA-256, 64)     ║  ║     ├─ Uploaded Marker                 ║
║     fileSize: Number (bytes, ≤10MB)    ║  ║     ├─ Downloaded File                 ║
║     mimeType: String                   ║  ║     ├─ Created Survey                  ║
║     ├─ image/jpeg                      ║  ║     ├─ Updated Survey                  ║
║     ├─ image/png                       ║  ║     ├─ Deleted Marker                  ║
║     ├─ application/pdf                 ║  ║     └─ Sign Out                        ║
║     ├─ text/csv                        ║  ║     role: String | null                ║
║     └─ application/json                ║  ║     ├─ SUPER_ADMIN                     ║
║     fileName: String (sanitized)       ║  ║     ├─ admin                           ║
║     uploadedAt: Date                   ║  ║     ├─ encoder                         ║
║     createdAt: Date (auto)             ║  ║     └─ researcher                      ║
║     updatedAt: Date (auto)             ║  ║     ipAddress: String | null           ║
║                                        ║  ║     ├─ IPv4 format                     ║
║ Indexes:                               ║  ║     └─ IPv6 format                     ║
║   • userId                             ║  ║     details: String (≤1000 chars)      ║
║   • createdAt desc                     ║  ║     userId: ObjectId | null → User     ║
║   • (latitude, longitude) geo          ║  ║     createdAt: Date (auto)             ║
║   • userId, createdAt                  ║  ║     updatedAt: Date (auto)             ║
║                                        ║  ║                                        ║
║ File Storage:                          ║  ║ Indexes:                               ║
║   Path: /backend/uploads/              ║  ║   • email, createdAt desc              ║
║   Format: [uuid]_[sanitized].[ext]     ║  ║   • action, createdAt desc             ║
║                                        ║  ║   • createdAt desc                     ║
╚════════════════════════════════════════╝  ║   • username                           ║
         │                                   ║                                        ║
         │ 1:N Relationship                 ╚════════════════════════════════════════╝
         │
         ▼

╔════════════════════════════════════════╗
║       EVENT COLLECTION                 ║
╠════════════════════════════════════════╣
║ PK  _id: ObjectId                      ║
║ FK  markerId: ObjectId → Marker._id    ║
║ FK  userId: ObjectId → User._id        ║
║     title: String                      ║
║     description: String | null         ║
║     date: Date                         ║
║     priority: Enum (medium)            ║
║     ├─ low                             ║
║     ├─ medium                          ║
║     ├─ high                            ║
║     └─ critical                        ║
║     status: Enum (planned)             ║
║     ├─ planned                         ║
║     ├─ ongoing                         ║
║     ├─ completed                       ║
║     └─ cancelled                       ║
║     createdAt: Date (auto)             ║
║     updatedAt: Date (auto)             ║
║                                        ║
║ Indexes:                               ║
║   • markerId                           ║
║   • userId                             ║
║   • status                             ║
║   • date                               ║
║   • createdAt desc                     ║
╚════════════════════════════════════════╝
```

---

## DFD Level 2 - Admin Dashboard Operations

```
Admin User Navigates to Dashboard
              │
              ▼
    ┌─────────────────────────────┐
    │ 4.1 AUTHENTICATE            │
    ├─────────────────────────────┤
    │ • Verify JWT token          │
    │ • Extract user ID + role    │
    └────────┬────────────────────┘
             │
    ┌────────▼──────────────┐
    │ USER ROLE?            │
    └────┬────────┬────┬────┘
         │        │    │
    SUPER│ ADMIN  │ENCOD│
    ADMIN│        │ER   │
         │        │    │
         ▼        ▼    ▼ (DENY)
    ALLOWED  ALLOWED  403 Forbidden


    Continues if Admin/Super Admin:
         │
         ▼
    ┌─────────────────────────────┐
    │ 4.2 FETCH DASHBOARD DATA    │
    ├─────────────────────────────┤
    │ Parallel Queries:           │
    │                             │
    │ Query 1: Get stats          │
    │ ├─ Total users: count()     │
    │ ├─ Active users: query()    │
    │ ├─ New today: count()       │
    │ └─ Total markers: count()   │
    │                             │
    │ Query 2: Get user list      │
    │ ├─ User.find()              │
    │ ├─ Limit: 20 per page       │
    │ ├─ Sort: createdAt desc     │
    │ └─ Pagination: skip/limit   │
    │                             │
    │ Query 3: Get recent events  │
    │ └─ ActivityLog.find()       │
    │    Limit: 50                │
    │    Sort: createdAt desc     │
    │                             │
    └────────┬────────────────────┘
             │
    ┌────────▼──────────────┐
    │ QUERIES COMPLETE?     │
    └────┬────────┬─────────┘
         │ NO     │ YES
         │   Error│
    Timeout│       ▼
         │    ┌─────────────────────────────┐
         │    │ 4.3 AGGREGATE RESULTS       │
         │    ├─────────────────────────────┤
         │    │ Combine all query results   │
         │    │ Format for display          │
         │    │ Calculate derived stats     │
         │    └────────┬────────────────────┘
         │             │
         │             ▼
         │    ┌─────────────────────────────┐
         │    │ 4.4 LOG ADMIN ACTION        │
         │    ├─────────────────────────────┤
         │    │ ActivityLog.create({        │
         │    │   action: "Admin accessed"  │
         │    │   role: "admin"             │
         │    │   details: "Dashboard view" │
         │    │ })                          │
         │    └────────┬────────────────────┘
         │             │
         └─────────────┼──────────────────┐
                       │                  │
                       ▼                  ▼
                  Continue          Log Error
                   (200 OK)          (5XX)
```

---

## DFD Level 2 - User Profile Update

```
User Updates Profile (Email/Password/Name)
              │
              ▼
    ┌─────────────────────────────┐
    │ 7.1 AUTHENTICATE            │
    ├─────────────────────────────┤
    │ • Verify JWT token          │
    │ • Extract user ID           │
    │ • Verify ownership (self)    │
    └────────┬────────────────────┘
             │
    ┌────────▼──────────────┐
    │ AUTHORIZED?           │
    └────┬──────────┬───────┘
         │ NO       │ YES
    403 Error       ▼
         │   ┌─────────────────────────────┐
         │   │ 7.2 VALIDATE NEW DATA       │
         │   ├─────────────────────────────┤
         │   │ New email format?           │
         │   │ New password strength?      │
         │   │ New name format?            │
         │   └────────┬────────────────────┘
         │            │
         │   ┌────────▼──────────────┐
         │   │ VALID?                │
         │   └────┬────────┬─────────┘
         │        │ NO     │ YES
         │    400 Error    ▼
         │        │   ┌─────────────────────────────┐
         │        │   │ 7.3 CHECK UNIQUE FIELDS     │
         │        │   ├─────────────────────────────┤
         │        │   │ If email changed:           │
         │        │   │ ├─ User.count({email})      │
         │        │   │ └─ Must be 0 or 1 (self)    │
         │        │   └────────┬────────────────────┘
         │        │            │
         │        │   ┌────────▼──────────────┐
         │        │   │ UNIQUE OK?            │
         │        │   └────┬────────┬─────────┘
         │        │        │ NO     │ YES
         │        │    409 Conflict │
         │        │        │        ▼
         │        │        │   ┌─────────────────────────────┐
         │        │        │   │ 7.4 PREPARE UPDATE OBJ      │
         │        │        │   ├─────────────────────────────┤
         │        │        │   │ updateData = {              │
         │        │        │   │   fullname: sanitize(new)   │
         │        │        │   │   email: lower(new)         │
         │        │        │   │ }                           │
         │        │        │   │                             │
         │        │        │   │ If password provided:       │
         │        │        │   │   hash = bcrypt(pwd, 10)    │
         │        │        │   │   updateData.password = hash│
         │        │        │   └────────┬────────────────────┘
         │        │        │            │
         │        │        │            ▼
         │        │        │   ┌─────────────────────────────┐
         │        │        │   │ 7.5 UPDATE RECORD           │
         │        │        │   ├─────────────────────────────┤
         │        │        │   │ User.findByIdAndUpdate(     │
         │        │        │   │   userId,                   │
         │        │        │   │   updateData,               │
         │        │        │   │   {new: true}               │
         │        │        │   │ )                           │
         │        │        │   └────────┬────────────────────┘
         │        │        │            │
         │        │        │   ┌────────▼──────────────┐
         │        │        │   │ UPDATE SUCCESS?       │
         │        │        │   └────┬────────┬─────────┘
         │        │        │        │ NO     │ YES
         │        │        │    Error│        ▼
         │        │        │        │   ┌─────────────────────────────┐
         │        │        │        │   │ 7.6 LOG UPDATE              │
         │        │        │        │   ├─────────────────────────────┤
         │        │        │        │   │ ActivityLog.create({        │
         │        │        │        │   │   action: "Profile updated" │
         │        │        │        │   │   details: "updated fields" │
         │        │        │        │   │ })                          │
         │        │        │        │   └────────┬────────────────────┘
         │        │        │        │            │
         └────────┴────────┴────────┴────────────┼──────┐
                                                 │      │
                                                 ▼      ▼
                                            Return    Log
                                            Updated   Error
                                            User
```

---

## Security Layer Mapping

### Per-Endpoint Security Chain

```
Request arrives at API endpoint

Step 1: PRE-ROUTE SECURITY
    ├─ CORS validation
    ├─ Rate limiting
    ├─ Request size limits
    └─ Security headers

Step 2: ROUTE-LEVEL SECURITY
    ├─ JWT verification
    ├─ Role authorization
    └─ Permission checking

Step 3: INPUT SECURITY
    ├─ Schema validation (express-validator)
    │  ├─ Type check
    │  ├─ Format check
    │  └─ Range check
    │
    ├─ Input sanitization
    │  ├─ XSS prevention
    │  ├─ HTML encoding
    │  └─ Whitespace trimming
    │
    └─ Contextual validation
       ├─ Ownership check
       ├─ Resource availability
       └─ Business rules

Step 4: BUSINESS LOGIC
    ├─ Process request
    ├─ Validate state
    └─ Apply rules

Step 5: DATABASE SECURITY
    ├─ Parameterized queries (Mongoose)
    ├─ NoSQL injection prevention
    └─ Access control

Step 6: OUTPUT SECURITY
    ├─ Data filtering
    ├─ HTML escaping
    ├─ JSON validation
    └─ Error sanitization

Step 7: POST-RESPONSE SECURITY
    ├─ Log event
    ├─ Update audit trail
    └─ Monitor anomalies
```

---

## Data Transformation Pipeline

```
Raw Input
    │
    ├─ removeXSS()
    │  └─ Removes: <>"'`/javascript:/event
    │
    ├─ escapeHtml()
    │  └─ Entity encoding: &lt; &gt; &quot; etc
    │
    ├─ trim()
    │  └─ Remove leading/trailing whitespace
    │
    ├─ toLowerCase() [email only]
    │  └─ Normalize for consistency
    │
    ├─ Type casting
    │  ├─ String → Number (coordinates)
    │  ├─ String → Date (ISO 8601)
    │  └─ String → ObjectId (mongo IDs)
    │
    └─ Validation
       ├─ Check constraints
       ├─ Verify relationships
       └─ Apply business rules
            │
            ▼
    Cleaned Input
        │
        ├─ Store in database
        │
        ├─ Log action
        │
        └─ Prepare response
             │
             ├─ Extract fields
             │
             ├─ Apply encoding
             │
             └─ JSON serialize
                  │
                  ▼
    Safe Output
```

---

## Concurrency Control Strategy

### Lock Management

```
Scenario: Two users uploading markers simultaneously

User A                                  User B
  │                                       │
  ├─ Request marker upload                │
  │  └─ Acquire write lock ◄─────────────┐│
  │                                       ││
  ├─ Validate file                        ││
  ├─ Save to disk                         ││ Waiting
  ├─ Calculate hash                       ││ for lock...
  ├─ Create DB record                     ││
  │                                       ││
  ├─ Release write lock ────────────────►│├─ Acquire write lock
  │                                       │
  │                                       ├─ Validate file
  │                                       ├─ Save to disk
  │                                       ├─ Calculate hash
  │                                       ├─ Create DB record
  │                                       │
  │                                       ├─ Release write lock
  │                                       │
  ▼                                       ▼

Result: Both uploads complete successfully
        No data corruption
        Audit trail shows both events
```

---

## Error Handling Flow

```
Error Occurs During Request
    │
    ├─ TYPE CHECK
    │  ├─ Validation Error (400)
    │  ├─ Not Found (404)
    │  ├─ Unauthorized (401)
    │  ├─ Forbidden (403)
    │  └─ Server Error (5XX)
    │
    ├─ LOG DECISION
    │  ├─ Validation → Log (info)
    │  ├─ Auth → Log (warn)
    │  ├─ Server → Log (error) with stack
    │  └─ Include: timestamp, user, action
    │
    ├─ SCRUB RESPONSE
    │  ├─ Remove stack traces (production)
    │  ├─ Generic error message
    │  ├─ Avoid internal details
    │  └─ Include request ID (for support)
    │
    └─ SEND RESPONSE
       ├─ HTTP status code
       ├─ Error message
       ├─ Request ID
       └─ Timestamp
```

---

## Query Performance Optimization

### Index Strategy

```
Collection          Queries                         Index
─────────────────────────────────────────────────────────
Users               findOne({email})                email (unique)
                    find({role})                    role
                    find({createdAt})               createdAt desc

Markers             find({userId})                  userId
                    find({userId, createdAt})       userId, createdAt
                    find({lat, lng})                2dsphere (geo)

Events              find({markerId})                markerId
                    find({userId})                  userId
                    find({status})                  status
                    find({date})                    date

ActivityLog         find({email, createdAt})        email, createdAt desc
                    find({action})                  action
                    find({createdAt})               createdAt desc
```

---

**Document Version:** 2.0  
**Date:** November 25, 2025  
**Status:** Technical Reference
