# System Architecture Diagrams

## Entity Relationship Diagram (ERD)

### MongoDB Collections and Relationships

```
┌─────────────────────────────────┐
│          User Collection        │
├─────────────────────────────────┤
│ _id (ObjectId) PK              │
│ fullname (String)              │
│ email (String) UNIQUE          │
│ password (String - hashed)     │
│ role (enum) ◄────┐             │
│ isAdmin (Boolean)│             │
│ lastLoginAt (Date)│            │
│ isEnabled (Boolean)│           │
│ createdAt (Date)  │           │
│ updatedAt (Date)  │           │
└─────────────────────────────────┘
         │                    │
         │ 1:N               │ 1:N
         ▼                    ▼
    ┌────────────────────┐  ┌──────────────────────┐
    │  Marker Collection │  │ ActivityLog Collection │
    ├────────────────────┤  ├──────────────────────┤
    │ _id (ObjectId) PK │  │ _id (ObjectId) PK    │
    │ userId (FK) ◄─────┼──┤ username (String)    │
    │ title (String)    │  │ email (String)       │
    │ description       │  │ action (enum)        │
    │ latitude (Number) │  │ role (String)        │
    │ longitude (Number)│  │ ipAddress (String)   │
    │ fileHash (String) │  │ details (String)     │
    │ fileSize (Number) │  │ userId (FK) [null]   │
    │ mimeType (String) │  │ createdAt (Date)     │
    │ uploadedAt (Date) │  │ updatedAt (Date)     │
    │ createdAt (Date)  │  └──────────────────────┘
    │ updatedAt (Date)  │
    └────────────────────┘
         │
         │ 1:N
         ▼
    ┌────────────────────┐
    │   Event Collection │
    ├────────────────────┤
    │ _id (ObjectId) PK │
    │ markerId (FK) ◄───┤
    │ userId (FK)       │
    │ title (String)    │
    │ description       │
    │ date (Date)       │
    │ priority (enum)   │
    │ status (enum)     │
    │ createdAt (Date)  │
    │ updatedAt (Date)  │
    └────────────────────┘
```

### Detailed Entity Specifications

#### User Entity
```
User {
  _id: ObjectId (Primary Key)
  fullname: String (required)
  email: String (required, unique, lowercase)
  password: String (required, bcrypt hashed with 10 rounds)
  role: Enum ["SUPER_ADMIN", "admin", "encoder", "researcher"] (default: "researcher")
  isAdmin: Boolean (default: false) [legacy, kept for compatibility]
  lastLoginAt: Date (nullable)
  isEnabled: Boolean (default: true)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  
  Indexes:
    - email (unique)
    - role
    - isEnabled
    - createdAt
  
  Relationships:
    - 1:N with Marker (userId references User._id)
    - 1:N with ActivityLog (userId references User._id)
    - 1:N with Event (userId references User._id)
}
```

#### Marker Entity
```
Marker {
  _id: ObjectId (Primary Key)
  userId: ObjectId (Foreign Key → User._id)
  title: String (required)
  description: String (optional)
  latitude: Number (required, range: -90 to 90)
  longitude: Number (required, range: -180 to 180)
  fileHash: String (SHA-256, 64 characters)
  fileSize: Number (bytes, max 10 MB)
  mimeType: String (enum: image/jpeg, image/png, application/pdf, text/csv, application/json)
  fileName: String (sanitized original filename)
  uploadedAt: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
  
  Indexes:
    - userId
    - latitude, longitude (geospatial)
    - createdAt
    - _id, createdAt (compound)
  
  Relationships:
    - N:1 with User (userId → User._id)
    - 1:N with Event (markerId references Marker._id)
}
```

#### ActivityLog Entity
```
ActivityLog {
  _id: ObjectId (Primary Key)
  username: String (required)
  email: String (required, lowercase)
  action: Enum [
    "Login",
    "Sign Out",
    "Uploaded Marker",
    "Downloaded File",
    "Created Survey",
    "Updated Survey",
    "Deleted Marker"
  ] (required)
  role: String (optional, enum roles)
  ipAddress: String (optional, IPv4/IPv6)
  details: String (optional, max 1000 chars)
  userId: ObjectId (Foreign Key → User._id, nullable)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  
  Indexes:
    - createdAt (descending)
    - email, createdAt
    - action, createdAt
    - username
  
  Relationships:
    - N:1 with User (userId → User._id) [nullable]
}
```

#### Event Entity
```
Event {
  _id: ObjectId (Primary Key)
  markerId: ObjectId (Foreign Key → Marker._id)
  userId: ObjectId (Foreign Key → User._id)
  title: String (required)
  description: String (optional)
  date: Date (required)
  priority: Enum ["low", "medium", "high", "critical"] (default: "medium")
  status: Enum ["planned", "ongoing", "completed", "cancelled"] (default: "planned")
  createdAt: Date (auto)
  updatedAt: Date (auto)
  
  Indexes:
    - markerId
    - userId
    - date
    - status
    - createdAt
  
  Relationships:
    - N:1 with Marker (markerId → Marker._id)
    - N:1 with User (userId → User._id)
}
```

### Entity Cardinality Summary

| From | To | Relationship | Description |
|------|----|-----------|----|
| User | Marker | 1:N | One user uploads many markers |
| User | Event | 1:N | One user creates many events |
| User | ActivityLog | 1:N | One user generates many activity logs |
| Marker | Event | 1:N | One marker has many associated events |
| ActivityLog | User | N:1 | Many activities attributed to one user (nullable) |

---

## Data Flow Diagram (DFD)

### Level 0 - System Context Diagram

```
┌─────────────┐
│   Users     │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP/HTTPS Requests & Responses
       │
       ▼
╔═══════════════════════════════════════════╗
║    Tekton Website System                  ║
║  ┌─────────────────────────────────────┐  ║
║  │   Express.js Backend API            │  ║
║  │   - Authentication                  │  ║
║  │   - Marker Management               │  ║
║  │   - Event Management                │  ║
║  │   - Activity Logging                │  ║
║  │   - Admin Functions                 │  ║
║  └─────────────────────────────────────┘  ║
╚═══════════════────┬──────────────────────╝
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
   ┌────────┐  ┌──────────┐  ┌──────────┐
   │MongoDB │  │  Logger  │  │   File   │
   │ Atlas  │  │ (Winston)│  │ Storage  │
   │        │  │          │  │ (Uploads)│
   └────────┘  └──────────┘  └──────────┘

Data Stores:
- MongoDB: User, Marker, Event, ActivityLog collections
- Winston Logger: Application logs
- File System: Uploaded marker files
```

### Level 1 - Main Process Decomposition

```
┌──────────────────────────────────────────────────────────┐
│         Tekton Website System (Level 1 DFD)             │
└──────────────────────────────────────────────────────────┘

                       ┌─────────────────────────┐
                       │   User Input (Frontend) │
                       └────────────┬────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │   1.0        │   │   2.0        │   │   3.0        │
        │ AUTHENTICATION│  │ MARKER       │   │ EVENT        │
        │               │  │ MANAGEMENT   │   │ MANAGEMENT   │
        │ • Signup      │  │              │   │              │
        │ • Login       │  │ • Upload     │   │ • Create     │
        │ • Logout      │  │ • Download   │   │ • View       │
        │ • Profile     │  │ • View       │   │ • Delete     │
        │               │  │ • Delete     │   │ • Update     │
        └────────┬──────┘  └──────┬───────┘   └───────┬──────┘
                 │                 │                   │
                 └─────────────────┼───────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │   4.0        │   │   5.0        │   │   6.0        │
        │ ADMIN        │   │ LOGGING      │   │ DATA         │
        │ FUNCTIONS    │   │ & AUDITING   │   │ INTEGRITY    │
        │              │   │              │   │              │
        │ • User List  │   │ • Activity   │   │ • Validation │
        │ • User Mgmt  │   │   Log        │   │ • Hashing    │
        │ • Stats      │   │ • Events     │   │ • Checksums  │
        │ • Dashboard  │   │ • Security   │   │ • Encryption │
        │              │   │              │   │              │
        └────────┬─────┘   └──────┬───────┘   └───────┬──────┘
                 │                 │                   │
                 └─────────────────┼───────────────────┘
                                   │
                            ┌──────▼────────┐
                            │ MongoDB Atlas │
                            │   (Data      │
                            │    Storage)   │
                            └───────────────┘
```

### Level 2 - Authentication Process DFD

```
User Input (Email, Password, Name)
              │
              ▼
    ┌─────────────────────────┐
    │ 1.1 VALIDATE INPUT      │
    ├─────────────────────────┤
    │ • Email format check    │
    │ • Password strength     │
    │ • Name format check     │
    │ • Whitelist validation  │
    └────────┬────────────────┘
             │
    ┌────────▼─────────────┐
    │ VALID?               │
    └────────┬─────┬───────┘
             │ NO  │ YES
             │     │
        Error│     ▼
        400  │   ┌─────────────────────────┐
             │   │ 1.2 SANITIZE DATA       │
             │   ├─────────────────────────┤
             │   │ • removeXSS()           │
             │   │ • escapeHtml()          │
             │   │ • toLowerCase() email   │
             │   │ • Trim whitespace       │
             │   └────────┬────────────────┘
             │            │
             │            ▼
             │   ┌─────────────────────────┐
             │   │ 1.3 CHECK EXISTING USER │
             │   ├─────────────────────────┤
             │   │ User.findOne({email})   │
             │   │ [Query MongoDB]         │
             │   └────────┬────────────────┘
             │            │
             │   ┌────────▼──────────┐
             │   │ USER EXISTS?      │
             │   └────┬────────┬─────┘
             │        │ YES    │ NO
             │   Error│        ▼
             │   409  │    ┌─────────────────────────┐
             │        │    │ 1.4 HASH PASSWORD       │
             │        │    ├─────────────────────────┤
             │        │    │ bcrypt.hash(pwd, 10)    │
             │        │    │ [CPU intensive: ~100ms] │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 1.5 CREATE USER RECORD  │
             │        │    ├─────────────────────────┤
             │        │    │ User.create({...})      │
             │        │    │ [Save to MongoDB]       │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 1.6 GENERATE JWT TOKEN  │
             │        │    ├─────────────────────────┤
             │        │    │ jwt.sign({id, role})    │
             │        │    │ Expires: 24 hours       │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 1.7 LOG SUCCESS EVENT   │
             │        │    ├─────────────────────────┤
             │        │    │ ActivityLog.create()    │
             │        │    │ [Audit trail]           │
             │        │    └────────┬────────────────┘
             │        │             │
             └────────┴─────────────▼
                      │
                      ▼
            Response to Client
            (Token + User Info)
```

### Level 2 - Marker Upload Process DFD

```
File Upload Request (File + Metadata)
              │
              ▼
    ┌─────────────────────────┐
    │ 2.1 AUTHENTICATE        │
    ├─────────────────────────┤
    │ • Verify JWT token      │
    │ • Extract user ID       │
    │ • Verify permissions    │
    └────────┬────────────────┘
             │
    ┌────────▼──────────────┐
    │ AUTHORIZED?           │
    └────────┬──────┬───────┘
             │ NO   │ YES
        Error│      ▼
        401  │   ┌─────────────────────────┐
             │   │ 2.2 VALIDATE FILE       │
             │   ├─────────────────────────┤
             │   │ • Size < 10 MB?         │
             │   │ • MIME type OK?         │
             │   │ • Extension OK?         │
             │   └────────┬────────────────┘
             │            │
             │   ┌────────▼──────────┐
             │   │ FILE VALID?       │
             │   └────┬────────┬─────┘
             │        │ NO     │ YES
             │   Error│        ▼
             │   400  │    ┌─────────────────────────┐
             │        │    │ 2.3 SANITIZE FILENAME   │
             │        │    ├─────────────────────────┤
             │        │    │ • Remove special chars  │
             │        │    │ • Limit length          │
             │        │    │ • Add unique suffix     │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 2.4 SAVE FILE TO DISK   │
             │        │    ├─────────────────────────┤
             │        │    │ FileSystem.write()      │
             │        │    │ /backend/uploads/...    │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 2.5 CALCULATE HASH      │
             │        │    ├─────────────────────────┤
             │        │    │ SHA-256(file_content)   │
             │        │    │ [64-char hex string]    │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 2.6 CREATE MARKER REC.  │
             │        │    ├─────────────────────────┤
             │        │    │ Marker.create({         │
             │        │    │   userId,               │
             │        │    │   fileHash,             │
             │        │    │   ...metadata           │
             │        │    │ })                      │
             │        │    │ [Save to MongoDB]       │
             │        │    └────────┬────────────────┘
             │        │             │
             │        │             ▼
             │        │    ┌─────────────────────────┐
             │        │    │ 2.7 LOG ACTIVITY        │
             │        │    ├─────────────────────────┤
             │        │    │ ActivityLog.create()    │
             │        │    │ action: "Uploaded Mark" │
             │        │    └────────┬────────────────┘
             │        │             │
             └────────┴─────────────▼
                      │
                      ▼
            Response to Client
            (Marker ID + File Info)
```

### Level 2 - Activity Logging Process DFD

```
User Action (Login, Upload, Download, etc.)
              │
              ▼
    ┌─────────────────────────┐
    │ 5.1 EXTRACT USER INFO   │
    ├─────────────────────────┤
    │ • From JWT token        │
    │ • From request context  │
    │ • Get IP address        │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ 5.2 PREPARE LOG ENTRY   │
    ├─────────────────────────┤
    │ Create ActivityLog:     │
    │ • username              │
    │ • email                 │
    │ • action (enum)         │
    │ • role                  │
    │ • ipAddress             │
    │ • details               │
    │ • userId (if applicable)│
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ 5.3 VALIDATE LOG ENTRY  │
    ├─────────────────────────┤
    │ • All required fields?  │
    │ • Action valid enum?    │
    │ • No XSS in details?    │
    └────────┬────────────────┘
             │
    ┌────────▼──────────────┐
    │ VALIDATION OK?        │
    └────────┬──────┬───────┘
             │ NO   │ YES
        Log  │      ▼
        Error│   ┌─────────────────────────┐
             │   │ 5.4 SAVE TO MONGODB     │
             │   ├─────────────────────────┤
             │   │ ActivityLog.create()    │
             │   │ [Insert into collection]│
             │   └────────┬────────────────┘
             │            │
             │   ┌────────▼──────────┐
             │   │ SAVE SUCCESS?     │
             │   └────┬────────┬─────┘
             │        │ NO     │ YES
             │   Log  │        ▼
             │   Error│    ┌─────────────────────────┐
             │        │    │ 5.5 INDEX OPTIMIZATION  │
             │        │    ├─────────────────────────┤
             │        │    │ MongoDB auto-indexes:   │
             │        │    │ • createdAt (for sort)  │
             │        │    │ • email (for filter)    │
             │        │    │ • action (for filter)   │
             │        │    └────────┬────────────────┘
             │        │             │
             └────────┴─────────────▼
                      │
                      ▼
            Log Complete
            (Continue with request)
```

### Level 2 - Data Integrity Check DFD

```
File Storage or Data Update
              │
              ▼
    ┌─────────────────────────┐
    │ 6.1 CALCULATE HASH      │
    ├─────────────────────────┤
    │ Input: File/Data        │
    │ Algorithm: SHA-256      │
    │ Output: 64-char hex     │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ 6.2 STORE WITH METADATA │
    ├─────────────────────────┤
    │ Save:                   │
    │ • content               │
    │ • hash (new)            │
    │ • previousHash          │
    │ • timestamp             │
    │ • version               │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ 6.3 LATER: VERIFY       │
    ├─────────────────────────┤
    │ Retrieve: content       │
    │ Recalculate: hash       │
    │ Compare: hash === hash  │
    └────────┬────────────────┘
             │
    ┌────────▼──────────────┐
    │ HASH MATCH?           │
    └────────┬──────┬───────┘
             │ NO   │ YES
             │      ▼
        🚨   │   ✅ DATA OK
        Alert│   Continue
             │
             ▼
        Log Tampering
        Incident
```

---

## Data Store Schema

### MongoDB Collections

```
Database: tekton_website

Collections:
├── users
│   └── Indexes: email (unique), role, isEnabled, createdAt
│
├── markers
│   └── Indexes: userId, createdAt, coordinates (geospatial)
│
├── events
│   └── Indexes: markerId, userId, status, date
│
└── activitylogs
    └── Indexes: email, action, createdAt
```

### File Storage Structure

```
Backend Upload Directory:
/backend/uploads/
├── [unique_identifier]_[sanitized_filename].[ext]
│   └── Example: "a3b0c42989_survey_location_001.jpg"
│
└── Metadata stored in Marker collection:
    - fileHash: SHA-256 hash
    - fileName: sanitized name
    - fileSize: bytes
    - mimeType: MIME type
    - uploadedAt: timestamp
```

---

## Process Flows Summary

| Process | Input | Output | Storage |
|---------|-------|--------|---------|
| Authentication | Email, Password | JWT Token, User | User collection |
| Marker Upload | File, Metadata | Marker ID, Hash | Markers collection, File system |
| Event Creation | Event data | Event ID | Events collection |
| Activity Logging | Action details | Log ID | ActivityLog collection |
| Data Integrity | File/Data | Hash, Checksum | MongoDB metadata |
| Admin Functions | Query parameters | Results, Stats | Multiple collections |

---

## Data Security in DFD

```
Every Data Store Access:
       │
       ▼
┌─────────────────────┐
│ AUTHENTICATION      │
│ Verify JWT token    │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ AUTHORIZATION       │
│ Check user role     │
│ Check permissions   │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ INPUT VALIDATION    │
│ Whitelist check     │
│ Type verification   │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ SANITIZATION        │
│ removeXSS()         │
│ escapeHtml()        │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ DATABASE ACCESS     │
│ Parameterized query │
│ (Mongoose ORM)      │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ OUTPUT ENCODING     │
│ HTML escape         │
│ Safe JSON response  │
└─────────────────────┘
```

---

**Diagram Version:** 1.0  
**Date:** November 25, 2025  
**System:** Tekton Website  
**Status:** Current Architecture
