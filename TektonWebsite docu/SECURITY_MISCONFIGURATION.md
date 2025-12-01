# Security Misconfiguration Prevention - Implementation Guide

## Feature 5: Security Misconfiguration
**Status:** Complete | **Files:** 1 core middleware + server integration

---

## Overview

Security misconfiguration is one of the most common vulnerabilities. It occurs when:
- Security headers are missing or improperly configured
- Default credentials are not changed
- Debugging features are enabled in production
- Sensitive error messages expose information
- CORS is configured incorrectly
- Framework settings don't follow best practices

This implementation ensures your application is hardened against misconfiguration attacks.

---

## Implementation Details

### 1. Comprehensive Security Headers

#### HTTP Strict Transport Security (HSTS)
```javascript
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- **Effect:** Enforces HTTPS for all connections
- **Duration:** 1 year (31536000 seconds)
- **Preload:** Allows inclusion in browser HSTS preload lists

#### Content Security Policy (CSP)
```javascript
Content-Security-Policy: default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self'; 
  connect-src 'self' https://api.mongodb.com; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self'
```
**Prevents:**
- Inline scripts ✅
- External scripts from untrusted sources ✅
- Embedding in iframes ✅
- Form submissions to external sites ✅

#### X-Content-Type-Options
```javascript
X-Content-Type-Options: nosniff
```
- **Effect:** Prevents MIME type sniffing
- **Benefit:** Browser respects Content-Type header

#### X-Frame-Options
```javascript
X-Frame-Options: DENY
```
- **Effect:** Prevents clickjacking attacks
- **Benefit:** Cannot be embedded in iframes

#### X-XSS-Protection
```javascript
X-XSS-Protection: 1; mode=block
```
- **Effect:** Legacy XSS protection
- **Benefit:** Stops XSS attacks in older browsers

#### Referrer-Policy
```javascript
Referrer-Policy: strict-origin-when-cross-origin
```
- **Effect:** Controls referrer information leakage
- **Benefit:** Privacy and security

#### Permissions-Policy
```javascript
Permissions-Policy: camera=(), microphone=(), geolocation=(), 
  payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), vr=()
```
- **Effect:** Disables unnecessary browser features
- **Benefit:** Prevents unauthorized feature access

---

### 2. Enhanced CORS Configuration

#### Environment-Based Origins
```javascript
// Development
allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

// Production (from environment variable)
allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'];
```

#### Validation Flow
```
1. Check if request origin is in whitelist
2. If yes: Set CORS headers, allow request
3. If no: Log warning, don't set CORS headers, reject
4. Handle preflight OPTIONS requests
```

#### CORS Headers Applied
```javascript
Access-Control-Allow-Origin: [validated-origin]
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Checksum, X-Timestamp
Access-Control-Max-Age: 86400  // 24 hours
```

#### Suspicious Origin Logging
```javascript
// Logs all rejected CORS requests for monitoring
logger.warn("🚨 [CORS] Rejected request from unauthorized origin: %s", origin);
```

---

### 3. Secure Error Handling

#### Development Environment
```javascript
// Detailed errors for debugging
{
  error: {
    message: "Error message",
    status: 500,
    path: "/api/users",
    method: "GET",
    timestamp: "2025-11-20T10:00:00Z",
    stack: "Error stack trace (if DEBUG=true)"
  }
}
```

#### Production Environment
```javascript
// Generic errors, no information leakage
{
  error: {
    message: "Internal Server Error",
    status: 500,
    timestamp: "2025-11-20T10:00:00Z"
  }
}
```

#### Sensitive Information Removal
- ❌ No stack traces (unless DEBUG enabled)
- ❌ No database error details
- ❌ No file paths or system information
- ❌ No version numbers
- ❌ No service names

---

### 4. Framework Security Hardening

#### Information Disclosure Prevention
```javascript
// Remove these headers
X-Powered-By          // Removed (no Express version exposed)
X-AspNet-Version      // Removed
X-AspNetMvc-Version   // Removed
Server                // Set to generic "Server"
```

#### Header Removal Code
```javascript
app.disable("x-powered-by");  // Express built-in
res.removeHeader("X-Powered-By");
res.setHeader("Server", "Server");  // Generic, not Express
```

---

### 5. Request Validation & Limits

#### Request Timeout (30 seconds)
```javascript
req.setTimeout(30000);
res.setTimeout(30000);
```

#### Content-Type Validation
```javascript
// Only allow application/json for POST/PUT/PATCH
const contentType = req.headers["content-type"];
if (!contentType.includes("application/json")) {
  // Log but continue (let route handlers decide)
}
```

#### User-Agent Scanning
```javascript
// Detect and log suspicious user agents
const suspiciousPatterns = [
  /sqlmap/i,      // SQL injection tool
  /nikto/i,       // Web scanner
  /nmap/i,        // Network mapper
  /masscan/i,     // Port scanner
  /nessus/i,      // Vulnerability scanner
  /qualys/i       // Security scanner
];
```

#### Request Size Limits
```javascript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb" }));
```

---

### 6. Environment Validation

#### Required Checks
```javascript
// Production-only
✅ JWT_SECRET configured
✅ TLS certificates available
✅ ALLOWED_ORIGINS configured
✅ DEBUG mode disabled
✅ NODE_ENV set correctly
```

#### Warnings
```javascript
⚠️ DEBUG enabled in production
⚠️ TLS certificates missing
⚠️ ALLOWED_ORIGINS not configured
```

#### Error Handling
```javascript
❌ Invalid NODE_ENV value
❌ Missing required secrets in production
```

---

## Configuration

### Environment Variables

```env
# Security Configuration
NODE_ENV=production
# Options: development, staging, production

ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
# Comma-separated list of allowed origins

DEBUG=false
# NEVER enable in production!

SHOW_ERROR_DETAILS=true
# Set to false in production

REQUEST_TIMEOUT=30000
# Milliseconds before request times out

RESPONSE_TIMEOUT=30000
# Milliseconds before response times out
```

---

## Security Features

### Information Disclosure Prevention ✅
- ❌ No Express version leakage
- ❌ No framework identification
- ❌ No stack traces in production
- ❌ No database error details
- ❌ No file paths exposed

### CORS Protection ✅
- ✅ Origin whitelisting
- ✅ Suspicious origin logging
- ✅ Credential handling
- ✅ Method restriction
- ✅ Header validation

### Security Headers ✅
- ✅ HSTS enforcement
- ✅ CSP protection
- ✅ Clickjacking prevention
- ✅ MIME sniffing prevention
- ✅ XSS protection
- ✅ Permissions policy

### Error Handling ✅
- ✅ Generic production errors
- ✅ Detailed development errors
- ✅ No information leakage
- ✅ Proper HTTP status codes
- ✅ Consistent error format

---

## Code Examples

### Using Enhanced CORS
```javascript
import { enhancedCorsMiddleware } from './middleware/securityConfig.js';

app.use(enhancedCorsMiddleware());
// Automatically uses environment-based origins
```

### Using Security Headers
```javascript
import { securityHeadersMiddleware } from './middleware/securityConfig.js';

app.use(securityHeadersMiddleware);
// Applies all security headers to responses
```

### Using Error Handler
```javascript
import { secureErrorHandler } from './middleware/securityConfig.js';

// At the end of your route definitions
app.use(secureErrorHandler);
```

### Validating Configuration
```javascript
import { validateSecurityConfiguration } from './middleware/securityConfig.js';

const validation = validateSecurityConfiguration();
if (!validation.valid) {
  console.error("Security configuration invalid");
  process.exit(1);
}
```

---

## Testing

### Test Security Headers
```bash
# Get response headers
curl -i http://localhost:5000/api/health

# Check for security headers
# Should see:
# - Strict-Transport-Security
# - Content-Security-Policy
# - X-Content-Type-Options
# - X-Frame-Options
```

### Test CORS
```bash
# Valid origin
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:5000/api/markers

# Invalid origin (should fail)
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:5000/api/markers
```

### Test Error Handling
```bash
# Should return generic error in production
curl -X POST http://localhost:5000/api/invalid-endpoint

# Development shows detailed error
NODE_ENV=development npm start
curl -X POST http://localhost:5000/api/invalid-endpoint
```

### Test Security Validation
```javascript
// Start server and check logs
npm start

// Should see:
// ✅ [SECURITY CONFIG] Security Configuration:
// ✅ [SECURITY VALIDATION] Security configuration validated
// 🔐 [SECURITY HEADERS] Applied security headers
```

---

## Deployment Checklist

- [ ] NODE_ENV=production
- [ ] ALLOWED_ORIGINS configured for production domain
- [ ] DEBUG=false
- [ ] JWT_SECRET set to strong value
- [ ] TLS certificates configured
- [ ] SHOW_ERROR_DETAILS=false in production
- [ ] REQUEST_TIMEOUT appropriate for your use case
- [ ] CORS headers validated
- [ ] Security headers applied to all responses
- [ ] Error messages are generic in production
- [ ] No framework information leaked in responses
- [ ] Server header is generic (not Express)

---

## Security Validation Results

**Startup Check Output:**
```
✅ [SECURITY CONFIG] Security Configuration:
  Environment: production
  HTTPS/TLS: Enforced
  CSP: Enabled (default-src 'self')
  CORS: Environment-based origin validation
  X-Frame-Options: DENY (Clickjacking protection)
  X-Content-Type-Options: nosniff (MIME sniffing prevention)
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: Disabled (camera, microphone, geolocation, etc.)
  Request Timeout: 30 seconds
  Error Messages: Generic
  Information Disclosure: Minimized
✅ [SECURITY VALIDATION] Security configuration validated
```

---

## Monitoring & Alerts

### Watch for in logs:
```
🚨 [CORS] Rejected request from unauthorized origin
🚨 [SECURITY] Suspicious User-Agent detected
🚨 [VALIDATION] Invalid Content-Type
🔥 [TIMEOUT] Request timeout for ...
🔥 [ERROR] Internal server error
```

### Set alerts for:
1. Multiple rejected CORS requests from same IP
2. Suspicious User-Agent patterns
3. High rate of request timeouts
4. Unusual error patterns

---

## References

- [OWASP: Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated:** November 20, 2025  
**Status:** ✅ Fully implemented and tested
