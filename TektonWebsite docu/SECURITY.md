# Security Implementation Guide

## Overview
This document outlines the security features implemented in the TektonWebsite backend to protect against cryptographic failures, authentication bypasses, and data exposure.

---

## 1. Cryptographic Failures & Secrets Management

### ✅ Environment Variables (No Hardcoded Secrets)
All sensitive configuration is stored in environment variables:

- **`JWT_SECRET`** - Session token signing key (required, must be strong)
- **`MONGO_URI`** - Database connection string with credentials
- **`NODE_ENV`** - Deployment environment (development/production)
- **`LOG_LEVEL`** - Logging verbosity (error/warn/info/http/debug)
- **`TLS_CERT`** - Path to HTTPS certificate (optional, for production)
- **`TLS_KEY`** - Path to HTTPS private key (optional, for production)

**Files Updated:**
- `backend/middleware/auth.js` - Removed hardcoded "devSecretKey123" fallback
- `backend/middleware/adminAuth.js` - Removed hardcoded "devSecretKey123" fallback
- `backend/routes/login.js` - Removed hardcoded "devSecretKey123" fallback
- `backend/server.js` - Validation of required env vars at startup

**Setup Instructions:**
1. Copy `.env.example` to `.env` (never commit `.env` to version control)
2. Generate a strong JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Update `JWT_SECRET` with the generated value
4. Ensure `MONGO_URI` uses a strong database password

### ⚠️ Important Reminders
- **NEVER** commit `.env` to git
- **NEVER** log passwords or tokens
- **ALWAYS** use strong, randomly-generated secrets
- **NEVER** use development secrets in production

---

## 2. Password Hashing (Bcrypt)

### ✅ Secure Password Hashing
All passwords are hashed using **bcrypt** with a minimum of 10 salt rounds (industry standard is 10-12).

**Implementation Details:**
- Hash algorithm: bcrypt (intentionally slow to resist brute force)
- Salt rounds: 10 (takes ~100ms per hash, prevents rainbow tables)
- Verification: bcrypt.compare() constant-time comparison

**Files Using Bcrypt:**
- `backend/routes/auth.js` - Signup password hashing (line 27)
- `backend/routes/login.js` - Password comparison (line 27)
- `backend/routes/change-password.js` - New password hashing (line 75)
- `backend/routes/adminUserRoutes.js` - Admin password reset (line 128)
- `backend/scripts/createSuperAdmin.js` - Super admin password hashing (line 20)

**Example:**
```javascript
// Signup: Hash password with 10 salt rounds
const hashedPassword = await bcrypt.hash(password, 10);

// Login: Compare plaintext password with hash
const isMatch = await bcrypt.compare(password, user.password);
```

### Password Requirements (Recommended)
Add client-side and server-side validation:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

## 3. Encryption in Transit (HTTPS/TLS)

### ✅ Security Headers Implemented
The following HTTP security headers are automatically added to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking attacks |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Content-Security-Policy` | `default-src 'self'` | Restrict resource loading to same origin |

**Implementation Location:** `backend/server.js` (middleware)

### ✅ TLS/HTTPS Configuration
Backend supports HTTPS for production deployments:

**For Local Development (HTTP - default):**
```bash
npm start
# Runs on http://localhost:5000
```

**For Production (HTTPS):**
1. Generate or obtain TLS certificates (e.g., from Let's Encrypt)
2. Set environment variables:
   ```bash
   export TLS_CERT=/path/to/server.crt
   export TLS_KEY=/path/to/server.key
   export NODE_ENV=production
   ```
3. Start the server:
   ```bash
   npm start
   # Runs on https://localhost:5000 with HSTS enabled
   ```

**Certificate Generation (Self-Signed for Testing):**
```bash
# Generate self-signed certificate for local testing only
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## 4. Logging & Monitoring (Security Events)

### ✅ Sensitive Data Redaction
The logger automatically redacts sensitive fields to prevent credential leakage:

**Fields Redacted:**
- `password` → `[REDACTED]`
- `oldPassword` → `[REDACTED]`
- `newPassword` → `[REDACTED]`

**Implementation:** `backend/logger.js` (scrub function)

### ✅ Security Events Logged
All authentication and authorization events are logged:

- ✅ Successful logins (email, userId)
- ✅ Failed logins (email, reason, IP address)
- ✅ Signup attempts (email, reason)
- ✅ Password changes (email, userId)
- ✅ Token verification failures (IP, reason)
- ✅ Unauthorized access attempts (role, path, userId)
- ✅ Admin actions (user delete, role changes, admin ID)

**Log Files:**
- `backend/logs/combined.log` - All events
- `backend/logs/error.log` - Errors only
- Console output in development mode

**Example Log Entry:**
```
2025-11-20T09:51:14.594Z info: [LOGIN] Login successful for email=user@example.com userId=507f1f77bcf86cd799439011
2025-11-20T09:51:15.003Z warn: [LOGIN] Failed login - invalid password for email=attacker@example.com from=192.168.1.100
```

---

## 5. Deployment Checklist

### ✅ Before Deploying to Production

- [ ] Generate strong `JWT_SECRET` (32+ characters, random)
- [ ] Set `NODE_ENV=production`
- [ ] Obtain TLS certificates (Let's Encrypt recommended)
- [ ] Set `TLS_CERT` and `TLS_KEY` paths
- [ ] Use strong database password (18+ characters)
- [ ] Enable MongoDB IP whitelist (restrict to server IPs only)
- [ ] Set up log monitoring/alerting for security events
- [ ] Review `.env.example` and ensure all vars are configured
- [ ] Test HTTPS connection: `curl -I https://your-domain.com`
- [ ] Verify HSTS header: `curl -I https://your-domain.com | grep Strict-Transport`

### Environment Variables for Production
```bash
PORT=443  # HTTPS default port
NODE_ENV=production
LOG_LEVEL=warn  # Reduce logging verbosity
MONGO_URI=mongodb+srv://prod-user:strong-password@prod-cluster.mongodb.net/prodDB
JWT_SECRET=<64-char-random-secret>
TLS_CERT=/etc/ssl/certs/your-cert.crt
TLS_KEY=/etc/ssl/private/your-key.key
```

---

## 6. Vulnerability Scanning & Updates

### Keeping Dependencies Secure
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Force major version updates
npm audit fix --force
```

### Recommended Practices
- Run `npm audit` in CI/CD pipeline
- Update dependencies regularly (monthly)
- Monitor security advisories: https://github.com/advisories
- Use GitHub Dependabot for automated updates

---

## 7. Additional Security Features (Coming Soon)

- [ ] Rate limiting on authentication endpoints
- [ ] Account lockout after failed login attempts (5+ in 15 min)
- [ ] Two-factor authentication (2FA)
- [ ] Refresh token rotation
- [ ] Field-level encryption for sensitive data (SSN, etc.)
- [ ] API key authentication for service-to-service calls

---

## 8. Security References

- **OWASP Top 10 2021:** https://owasp.org/Top10/
- **Bcrypt Security:** https://auth0.com/blog/hashing-in-action-understanding-bcrypt/
- **HSTS:** https://tools.ietf.org/html/rfc6797
- **CSP:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **Let's Encrypt (Free TLS):** https://letsencrypt.org/

---

## Support & Questions

For security-related questions or to report vulnerabilities:
1. DO NOT create public issues for security vulnerabilities
2. Contact the development team privately
3. Provide detailed steps to reproduce
4. Allow time for a fix before public disclosure

**Last Updated:** November 20, 2025
