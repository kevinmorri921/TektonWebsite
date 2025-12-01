# Injection Prevention Guide

## Overview
This document outlines the injection prevention security measures implemented in TektonWebsite backend to protect against SQL injection, NoSQL injection, XSS, and command injection attacks.

---

## 1. Input Validation & Sanitization

### ✅ Validation Framework
- **express-validator** - Validates and sanitizes incoming request data
- **joi** - Alternative schema validation (available for use)

**Implementation File:** `backend/middleware/validation.js`

### ✅ Validation Schemas (Available for All Routes)

| Field | Validation Rules | Status |
|-------|------------------|--------|
| `email` | Valid email format, trimmed, normalized | ✅ Applied |
| `password` | Min 8 chars, uppercase, lowercase, number, special char | ✅ Applied |
| `fullname` | 2-100 chars, letters/spaces/hyphens/apostrophes only | ✅ Applied |
| `role` | Enum: SUPER_ADMIN, admin, encoder, researcher | ✅ Applied |
| `mongoId` | Valid 24-character MongoDB ObjectId format | ✅ Applied |
| `latitude` | Float between -90 and 90 | ✅ Applied |
| `longitude` | Float between -180 and 180 | ✅ Applied |
| `eventTitle` | 1-255 characters | ✅ Applied |
| `eventDescription` | Max 5000 characters | ✅ Applied |
| `eventDate` | Valid ISO 8601 date format | ✅ Applied |

**Example Usage:**
```javascript
router.post(
  "/signup",
  validationSchemas.email,
  validationSchemas.password,
  validationSchemas.fullname,
  handleValidationErrors,
  async (req, res) => {
    // Handler receives validated data only
  }
);
```

### ✅ Input Sanitization

The `sanitizeInput` helper removes dangerous characters:

```javascript
// Remove XSS payloads
sanitizeInput.removeXSS(userInput); 
// Removes: <, >, ", ', backticks, javascript:, event handlers

// Escape HTML entities (for response output)
sanitizeInput.escapeHtml(userInput);
// Converts: < → &lt;, > → &gt;, etc.

// Sanitize entire object recursively
sanitizeInput.sanitizeObject(reqBodyObject);
```

**Applied In:**
- ✅ `routes/auth.js` - fullname sanitization on signup
- ✅ `routes/update-profile.js` - fullname sanitization
- ✅ `routes/markerRoutes.js` - survey data sanitization
- ✅ `routes/eventRoutes.js` - title/description sanitization
- ✅ `routes/adminUserRoutes.js` - all text field sanitization

---

## 2. NoSQL Injection Prevention

### ✅ Mongoose Parameterized Queries
Mongoose automatically uses parameterized queries, preventing NoSQL injection. **All database operations are safe by default.**

**Good Example (Parameterized):**
```javascript
// ✅ SAFE - Uses parameterized query
const user = await User.findOne({ email: userEmail });

// ✅ SAFE - Mongoose handles escaping
const marker = await Marker.findById(mongoId);

// ✅ SAFE - Operator injection prevented
const user = await User.find({ role: { $in: allowedRoles } });
```

**Bad Example (NEVER do this):**
```javascript
// ❌ UNSAFE - Don't use JavaScript object constructors
const user = await User.find(eval(req.query));

// ❌ UNSAFE - Don't build queries dynamically
const query = `{ email: "${req.body.email}" }`;
```

### ✅ ObjectId Validation
All MongoDB ID parameters are validated before use:

```javascript
// Validates ObjectId format (24 hex characters)
router.get("/:id", validationSchemas.mongoId, handleValidationErrors, ...);

// Error returned if invalid format
// Example: Invalid ObjectId "123" rejected before reaching database
```

**Applied In:**
- ✅ `routes/markerRoutes.js` - GET/:id, PUT/:id, DELETE/:id
- ✅ `routes/eventRoutes.js` - GET/:id (via PUT/DELETE)
- ✅ `routes/adminUserRoutes.js` - All user ID parameters

---

## 3. XSS (Cross-Site Scripting) Prevention

### ✅ Input Sanitization
Dangerous HTML/JavaScript characters removed from user input:

**Example Payloads Blocked:**
```javascript
// Input: "<script>alert('XSS')</script>"
// Output: "scriptalert('XSS')/script" (tags removed)

// Input: 'onclick="alert(1)"'
// Output: 'alert(1)"' (event handler removed)

// Input: "javascript:alert(1)"
// Output: "alert(1)" (javascript: protocol removed)
```

### ✅ Output Encoding
HTML special characters escaped in API responses:

**Example:**
```javascript
// Input: "<img src=x onerror='alert(1)'>"
// Output: "&lt;img src=x onerror=&#039;alert(1)&#039;&gt;"

// In markerRoutes.js:
const formattedMarker = {
  name: sanitizeInput.escapeHtml(latestSurvey.name),
  radioOne: sanitizeInput.escapeHtml(latestSurvey.radioOne),
};
```

### ✅ Error Messages
Safe error responses that don't expose internal details:

```javascript
// ❌ BAD - Leaks internal path
res.status(500).json({ error: error.stack });

// ✅ GOOD - Safe message (implemented)
sendSafeError(res, 500, "Server error");

// Development only includes stack (if NODE_ENV=development)
sendSafeError(res, 500, "Server error", true); // includes stack
```

**Applied In:**
- ✅ All route error handlers use `sendSafeError()`
- ✅ Validation errors sanitized
- ✅ Stack traces only shown in development

---

## 4. SQL Injection Prevention

**Status:** ✅ **Not Applicable** - Using MongoDB (NoSQL), not SQL

However, if SQL database is added in future:
- Use prepared statements / parameterized queries
- Never concatenate user input into SQL strings
- Use an ORM like Sequelize or TypeORM

---

## 5. Command Injection Prevention

**Status:** ✅ **Secure** - Backend does not execute shell commands

If command execution is needed in future:
- Never pass user input directly to `child_process.exec()`
- Use `child_process.execFile()` with argument array (not shell string)
- Whitelist allowed commands

**Bad (NEVER do):**
```javascript
// ❌ UNSAFE
exec(`process_data.sh ${req.body.filename}`);
```

**Good (if needed):**
```javascript
// ✅ SAFE
execFile('process_data.sh', [filename]);
```

---

## 6. Routes Protected with Validation

### Authentication Routes
| Route | Method | Validation | Sanitization |
|-------|--------|-----------|--------------|
| `/api/signup` | POST | email, password, fullname, role | fullname |
| `/api/login` | POST | email, password | - |
| `/api/auth/change-password` | POST | password (current & new) | - |
| `/api/auth/update-profile` | POST | fullname | fullname |
| `/api/auth/delete-account` | DELETE | - | - |

### Data Routes
| Route | Method | Validation | Sanitization |
|-------|--------|-----------|--------------|
| `/api/markers` | POST | latitude, longitude | survey data |
| `/api/markers/:id` | GET | mongoId | - |
| `/api/markers/:id` | PUT | mongoId | all fields |
| `/api/markers/:id` | DELETE | mongoId | - |
| `/api/events` | POST | title, description, date | title, description |
| `/api/events/:id` | GET | - | - |
| `/api/events/:id` | PUT | mongoId, title, desc, date | title, description |
| `/api/events/:id` | DELETE | mongoId | - |

### Admin Routes
| Route | Method | Validation | Sanitization |
|-------|--------|-----------|--------------|
| `/api/admin/users/:userId` | PUT | mongoId, email, fullname | fullname |
| `/api/admin/users/:userId/role` | PUT | mongoId, role | - |
| `/api/admin/users/:userId` | DELETE | mongoId | - |
| `/api/admin/users/:userId/toggle-status` | PUT | mongoId, active boolean | - |

---

## 7. Middleware Chain Example

```javascript
// Complete validation + sanitization pipeline:
router.post(
  "/signup",
  // 1. Validate email format
  validationSchemas.email,
  // 2. Validate password strength
  validationSchemas.password,
  // 3. Validate name format
  validationSchemas.fullname,
  // 4. Validate role enum
  validationSchemas.role,
  // 5. Check for validation errors
  handleValidationErrors, // Returns 400 if any validation failed
  // 6. Handler receives validated data only
  async (req, res) => {
    // Input is safe to use - already validated & sanitized
    const { fullname, email, password, role } = req.body;
    
    // Additional sanitization for extra safety
    const sanitizedName = sanitizeInput.removeXSS(fullname);
    
    // Proceed with business logic
  }
);
```

---

## 8. Logging Injection Prevention

All user input logged with redaction to prevent log injection attacks:

```javascript
// ✅ Safe logging (implemented via logger.js scrub())
logger.info("[LOGIN] Login for email=%s from %s", email, req.ip);

// ❌ NEVER do this:
logger.info(`[LOGIN] Login for ${req.body}`);  // Could inject newlines/commands
```

**Protected Fields:**
- password → [REDACTED]
- oldPassword → [REDACTED]
- newPassword → [REDACTED]

---

## 9. Testing Injection Prevention

### Test Invalid Inputs

**Email Injection:**
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"Test@1234","fullname":"Test"}'
# Expected: 400 - "Invalid email address"
```

**XSS Payload:**
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test@1234","fullname":"<script>alert(1)</script>"}'
# Expected: 201 - fullname stored as "scriptalert(1)/script"
```

**Invalid MongoDB ID:**
```bash
curl http://localhost:5000/api/markers/invalid-id
# Expected: 400 - "Invalid ID format"
```

**SQL-like Injection (NoSQL):**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"anything"}'
# Expected: 400 - "Invalid email address"
```

---

## 10. Development Checklist

### When Adding New Routes:

- [ ] Define validation schema for all inputs
- [ ] Add `handleValidationErrors` middleware
- [ ] Sanitize string inputs with `sanitizeInput.removeXSS()`
- [ ] Escape outputs with `sanitizeInput.escapeHtml()`
- [ ] Use Mongoose queries (never string concatenation)
- [ ] Validate ObjectIds before database use
- [ ] Use `sendSafeError()` for error responses
- [ ] Log security events without exposing sensitive data
- [ ] Test with malicious payloads

### Validation Schema Template:

```javascript
// Define in middleware/validation.js
body('fieldName')
  .trim()
  .isLength({ min: 1, max: 255 })
  .withMessage('Field must be 1-255 characters')
  .matches(/^[a-zA-Z0-9-]+$/) // Only alphanumeric/hyphens
  .withMessage('Invalid characters'),

// Use in route:
router.post("/", validationSchemas.fieldName, handleValidationErrors, handler);
```

---

## 11. Security References

- **OWASP Top 10 - Injection:** https://owasp.org/Top10/A03_2021-Injection/
- **XSS Prevention:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- **NoSQL Injection:** https://owasp.org/www-community/attacks/NoSQL_Injection
- **express-validator Docs:** https://express-validator.github.io/docs/

---

**Last Updated:** November 20, 2025
