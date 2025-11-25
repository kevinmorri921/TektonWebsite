# System Architecture - Visual Reference Guide

## Quick Entity Reference

### All Entities at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ENTITIES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER                          MARKER                                  │
│  ├─ _id                        ├─ _id                                 │
│  ├─ fullname                   ├─ userId (FK)                         │
│  ├─ email (unique)             ├─ title                               │
│  ├─ password (hashed)          ├─ description                         │
│  ├─ role                       ├─ latitude                            │
│  ├─ isEnabled                  ├─ longitude                           │
│  └─ lastLoginAt                ├─ fileHash                            │
│                                ├─ fileSize                            │
│  EVENT                          ├─ mimeType                            │
│  ├─ _id                        ├─ fileName                            │
│  ├─ markerId (FK)              └─ uploadedAt                          │
│  ├─ userId (FK)                                                       │
│  ├─ title                      ACTIVITYLOG                            │
│  ├─ description                ├─ _id                                 │
│  ├─ date                       ├─ username                            │
│  ├─ priority                   ├─ email                               │
│  └─ status                     ├─ action (enum)                       │
│                                ├─ role                                │
│                                ├─ ipAddress                           │
│                                ├─ details                             │
│                                └─ userId (FK, nullable)               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Relationship Map

### User-Centric View

```
                              ┌─────────────┐
                              │    USER     │
                              └──────┬──────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
            ┌─────────┐        ┌─────────┐       ┌────────────┐
            │ MARKER  │        │  EVENT  │       │ ACTIVITY   │
            │(1:N)    │        │(1:N)    │       │   LOG      │
            │         │        │         │       │(1:N)       │
            └────┬────┘        └────┬────┘       └────────────┘
                 │                  │
                 │                  │
                 └──────────┬───────┘
                            │
                      (via markerId)
                            │
                            ▼
                        Can have multiple
                        events per marker

Key Points:
• 1 User → Many Markers
• 1 User → Many Events
• 1 User → Many ActivityLog entries
• 1 Marker → Many Events
• ActivityLog has NULL userId for certain events
```

---

## Process Flow Summary

### Main Workflows

```
┌─────────────────────────────────────────────────────┐
│               AUTHENTICATION FLOW                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Frontend]                    [Backend]            │
│      │                              │               │
│      ├─ Email/Password ────────────►│               │
│      │                              ├─ Validate    │
│      │                              ├─ Hash check  │
│      │                              ├─ Gen JWT     │
│      │◄────────── JWT Token ────────┤               │
│      │                              │               │
│      └─ Store Token in LS           │               │
│                                     │               │
│  [Future Requests]                  │               │
│      │                              │               │
│      ├─ Authorization: Bearer JWT ─►│               │
│      │                              ├─ Verify JWT  │
│      │                              ├─ Extract ID  │
│      │                              ├─ Check Role  │
│      │◄────── Protected Response ───┤               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────┐
│            MARKER UPLOAD FLOW                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Frontend]                    [Backend]            │
│      │                              │               │
│      ├─ File +JWT+Metadata ────────►│               │
│      │                              ├─ Authenticate│
│      │                              ├─ Validate    │
│      │                              ├─ Save File   │
│      │                              ├─ Hash File   │
│      │                              ├─ Create DB   │
│      │                              │   Record     │
│      │                              ├─ Log Activity│
│      │◄────── Marker + Hash ────────┤               │
│      │                              │               │
│      └─ Store Marker ID             │               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Data Store Relationships

### Collection Dependencies

```
USERS (Core)
    │
    ├──► MARKERS (needs userId)
    │         │
    │         └──► EVENTS (needs markerId + userId)
    │
    ├──► EVENTS (needs userId)
    │
    └──► ACTIVITYLOG (references userId, but nullable)
```

### Query Dependencies

```
Scenario: Get all markers for a user
    └─► Query: Markers.find({userId: user._id})
        Result: Array of Marker documents

Scenario: Get all events for a marker
    └─► Query: Events.find({markerId: marker._id})
        Result: Array of Event documents

Scenario: Get user activity
    └─► Query: ActivityLog.find({email: user.email})
        Result: Activity history

Scenario: Get marker integrity check
    └─► Recalculate hash
        Compare with stored hash
        Result: Tamper detection
```

---

## Data Flow - Complete Journey

### User Journey: Upload Marker with Event

```
1. USER LOGS IN
   │
   ├─► Signup/Login → Generate JWT Token
   │
   ├─► Log: ActivityLog { action: "Login" }
   │
   ▼

2. USER UPLOADS MARKER
   │
   ├─► Frontend: Select file + add metadata
   │
   ├─► Backend:
   │   ├─ Verify JWT
   │   ├─ Extract userId
   │   ├─ Validate file (size, type)
   │   ├─ Sanitize filename
   │   ├─ Save to disk
   │   ├─ Calculate SHA-256 hash
   │   ├─ Create Marker record in DB
   │   ├─ Log: ActivityLog { action: "Uploaded Marker" }
   │
   ▼

3. USER CREATES EVENT FOR MARKER
   │
   ├─► Frontend: Enter event details
   │
   ├─► Backend:
   │   ├─ Verify JWT
   │   ├─ Extract userId
   │   ├─ Create Event record with markerId
   │   ├─ Log: ActivityLog { action: "Created Survey" }
   │
   ▼

4. ADMIN VIEWS EVENT LOG
   │
   ├─► Query: ActivityLog.find()
   │
   ├─► Displays:
   │   ├─ Login event
   │   ├─ Upload event
   │   ├─ Create Survey event
   │
   ▼

5. USER LOGS OUT
   │
   ├─► Frontend: Click logout
   │
   ├─► Backend:
   │   ├─ Verify JWT (still valid)
   │   ├─ Create ActivityLog { action: "Sign Out" }
   │   ├─ Return success
   │
   ├─► Frontend: Clear token, redirect to login
   │
   ▼

RESULT: Complete audit trail in ActivityLog
```

---

## Data Security Checkpoint Map

```
Entry Point: HTTP Request
     │
     ▼
┌──────────────────────────┐
│ 🔒 CORS Validation       │
│    - Origin check        │
│    - Method check        │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Security Headers      │
│    - HSTS                │
│    - CSP                 │
│    - X-Frame-Options     │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Authentication        │
│    - JWT Verification    │
│    - Signature check     │
│    - Expiration check    │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Authorization         │
│    - Role-based access   │
│    - Permission check    │
│    - Scope verification  │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Input Validation      │
│    - Schema check        │
│    - Type validation     │
│    - Range checking      │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Input Sanitization    │
│    - XSS removal         │
│    - HTML encoding       │
│    - SQL injection prev. │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Business Logic        │
│    - Process with access │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Data Store Access     │
│    - Parameterized query │
│    - ORM protection      │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Output Encoding       │
│    - HTML escape         │
│    - Safe JSON           │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 🔒 Logging & Audit       │
│    - Activity recorded   │
│    - Security events log │
└──────────────────────────┘
     │
     ▼
Response to Client (Safe & Secure)
```

---

## Concurrency & Consistency

### Atomicity Guarantees

```
Operation: Update Marker
    ┌─ Start Transaction
    │
    ├─ Verify user owns marker
    ├─ Update marker fields
    ├─ Recalculate hash
    ├─ Update audit timestamp
    ├─ Create activity log
    │
    └─ Commit (all-or-nothing)

If any step fails → Rollback all changes
Result: Database remains consistent
```

### Concurrent Request Handling

```
Request 1: Upload File        Request 2: Query Markers
    │                              │
    ├─ Write lock on Markers ◄────┼─ Read lock acquired
    │                              │
    ├─ Insert new marker           ├─ Read existing markers
    │                              │
    ├─ Release lock ───────────────►│
    │                              │ Sees new marker
    │                              │
    ▼                              ▼
   Both complete successfully
   No race condition
```

---

## Monitoring Points in DFD

```
System Visibility:

┌─────────────────────────────────┐
│ REQUEST LOGGING                 │
│ • All API calls                 │
│ • Request body (scrubbed)       │
│ • Response status               │
│ • Execution time                │
│ • User context                  │
│ • IP address                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ERROR LOGGING                   │
│ • Stack traces                  │
│ • Error context                 │
│ • Failed operation              │
│ • User involved                 │
│ • Timestamp                     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ AUDIT LOGGING                   │
│ • Login/Logout events           │
│ • Data modifications            │
│ • File uploads                  │
│ • Admin actions                 │
│ • Security events               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ PERFORMANCE METRICS             │
│ • Database query time           │
│ • File processing time          │
│ • API response time             │
│ • Hash calculation time         │
│ • Network latency               │
└─────────────────────────────────┘
```

---

## Archival & Retention

### Data Lifecycle

```
Active Use (Online):
    ├─ Users: Indefinite
    ├─ Markers: Indefinite
    ├─ Events: Indefinite
    └─ ActivityLog: 90 days (hot)

Archive (Cold Storage):
    ├─ ActivityLog: 1-2 years
    ├─ Audit events: 3-7 years (compliance)
    └─ Deleted data: Recovery period 30 days

Purge (Legal Hold):
    └─ Delete after retention period
```

---

## Integration Points

### External Systems

```
Tekton System ◄──────────────► External Systems

                   ├─► Email Service (user notifications)
                   ├─► File Storage (cloud backup)
                   ├─► Analytics (usage patterns)
                   ├─► Monitoring (system health)
                   └─► LDAP/OAuth (SSO - future)
```

---

**Reference Version:** 1.0  
**Date:** November 25, 2025  
**Audience:** Developers, Architects, Auditors
