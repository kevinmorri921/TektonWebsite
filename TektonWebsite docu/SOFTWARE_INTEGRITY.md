# Software and Data Integrity Failures - Security Implementation

## ✅ Completed Security Measures

### 1. File Upload Security

#### File Upload Middleware (`backend/middleware/fileUpload.js`)

Comprehensive file upload validation and security:

**File Size Limits:**
```javascript
MAX_FILE_SIZE = 10 MB
```

**Allowed File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, CSV, JSON
- MIME type validation enforced
- Extension validation (whitelist-based)

**Filename Sanitization:**
```javascript
// Prevents path traversal attacks (../../etc/passwd)
// Removes dangerous characters
// Prevents double extensions (shell.php.jpg)
// Adds timestamp + random suffix for uniqueness
// Limits to 255 characters
```

**File Integrity:**
```javascript
// SHA-256 hash calculated for every uploaded file
// Hash stored for verification purposes
// Can detect file tampering or corruption
```

**Security Features:**
- ✅ Path traversal prevention (validates file is within upload directory)
- ✅ MIME type validation
- ✅ Extension whitelist
- ✅ Size limit enforcement
- ✅ Filename sanitization
- ✅ Secure file storage with permissions
- ✅ SHA-256 hash calculation for integrity

**Usage:**
```javascript
import { fileUploadValidation, saveUploadedFile } from './middleware/fileUpload.js';

// Apply to routes
app.post('/api/upload', fileUploadValidation, async (req, res) => {
  try {
    const fileInfo = await saveUploadedFile(req.file);
    res.json({
      filename: fileInfo.filename,
      hash: fileInfo.hash,
      size: fileInfo.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

**File Operations:**
```javascript
// Calculate hash for verification
const hash = await calculateFileHash('/path/to/file');

// Verify file hasn't been tampered with
const isValid = await verifyFileHash('/path/to/file', expectedHash);

// Delete file securely
await deleteUploadedFile('filename.pdf');

// Get file information
const info = await getFileInfo('filename.pdf');
// Returns: {filename, path, size, created, modified, hash}
```

---

### 2. Data Integrity Verification

#### Data Integrity Middleware (`backend/middleware/dataIntegrity.js`)

**Checksum & Hash Verification:**
```javascript
// Calculate SHA-256 hash of data
const hash = calculateDataHash(userData);

// Verify data hasn't been modified
const isValid = verifyDataIntegrity(userData, expectedHash);

// Calculate hash of composite fields
const compositeHash = calculateCompositeHash({
  email: 'user@test.com',
  role: 'admin',
  status: 'active'
});
```

**Integrity Metadata:**
```javascript
// Add integrity tracking to documents
const integrity = addIntegrityMetadata(userData);
// Returns: {hash, timestamp, version}

// Update when data changes
const updated = updateIntegrityMetadata(oldIntegrity, newData);
// Returns: {hash, timestamp, version, previousHash}
```

**Tampering Detection:**
```javascript
// Detect if data has been modified
const isTampered = hasDataBeenTampered(storedData, storedIntegrity);

// Example: Verify user record wasn't modified in database
if (hasDataBeenTampered(user, user.integrity)) {
  logger.error('User record has been tampered with!');
  // Take action: alert, rollback, etc.
}
```

**Data Signatures:**
```javascript
// Create cryptographic signature
const signature = generateDataSignature(data, process.env.JWT_SECRET);

// Verify signature (prevents forgery)
const isValid = verifyDataSignature(data, signature, process.env.JWT_SECRET);
```

**Database Transactions:**
```javascript
// Atomic operations for data consistency
const session = await startTransaction(mongoose.connection);

try {
  // Multiple operations here - all or nothing
  await User.updateOne({_id: userId}, updates, {session});
  await Audit.create([{action: 'update', userId}], {session});
  
  await commitTransaction(session);
} catch (error) {
  await rollbackTransaction(session);
  throw error;
}
```

**Checksum Validation Middleware:**
```javascript
// Verify request body integrity via X-Checksum header
app.post('/api/critical-endpoint', checksumValidation, handler);

// Client sends:
// POST /api/critical-endpoint
// X-Checksum: a1b2c3d4...
// Body: {...}
```

---

### 3. Package Integrity & Dependency Management

#### Dependency Management (`backend/middleware/dependencyManagement.js`)

**Startup Audits:**
```javascript
// 1. Validate lock file presence
const lockCheck = validateLockFilePresence();
// Returns: {hasLockFile, lockType, inSync, issues}

// 2. Audit package.json scripts for dangerous patterns
const scriptAudit = auditPackageJsonScripts(packageJson);
// Detects: eval(), new Function(), execSync(), downloads, etc.

// 3. Check for suspicious/outdated packages
const qualityCheck = checkDependencyQuality(packageJson);
// Flags: loose version ranges (*, latest), deprecated packages, etc.

// 4. Scan for eval/Function usage in code
const dangerousCheck = checkForDangerousFunctions();
// Scans all .js files in backend/ for dangerous patterns
```

**Complete Audit Report:**
```javascript
const report = generateDependencyAuditReport();
// {
//   timestamp,
//   scriptAudit: {isClean, issues},
//   qualityCheck: {alerts, warnings},
//   lockFileCheck: {hasLockFile, lockType, inSync},
//   summary: {totalDependencies, scriptIssues, warnings, versionAlerts}
// }
```

**Security Checks:**
- ✅ package-lock.json must exist (prevents dependency injection)
- ✅ No eval() or Function() constructors
- ✅ No child_process.exec() with user input
- ✅ No dangerous npm lifecycle hooks (preinstall/postinstall)
- ✅ No suspicious package downloads
- ✅ No overly permissive version ranges
- ✅ No deprecated packages

**Integration:**
```javascript
// Automatically runs on server startup
// Results logged to backend/logs/combined.log
// Exits with error if dangerous functions found
```

---

## Server Integration

### Startup Sequence

The server now performs comprehensive integrity checks on startup:

```
1. Load environment variables (.env)
2. Connect to MongoDB
3. ✅ Audit all dependencies
   - Check for package-lock.json
   - Validate package.json scripts
   - Check dependency quality
   - Scan for dangerous functions
4. ✅ Prepare file upload directory
5. ✅ Initialize security middleware
6. Start listening on port 5000
```

### Log Example

```
[10:15:20] info: 🔍 [STARTUP] Validating dependencies and integrity...
[10:15:21] info: 📦 [DEPENDENCY AUDIT] Total dependencies: 10
[10:15:21] info: ✅ [DEPENDENCY AUDIT] No suspicious script patterns found
[10:15:21] info: ✅ [DEPENDENCY AUDIT] No suspicious packages detected
[10:15:21] info: ✅ [DEPENDENCY AUDIT] Lock file present (npm)
[10:15:21] info: ✅ [STARTUP] Dependency audit complete - safe to proceed
[10:15:21] info: 📁 Upload directory ready
[10:15:21] info: 🚀 Server running on http://localhost:5000
[10:15:22] info: ✅ Connected to MongoDB Atlas
```

---

## Best Practices

### For File Uploads

1. **Always validate files:**
   - Check MIME type
   - Verify extension
   - Validate file size
   - Scan filename for malicious content

2. **Store securely:**
   - Outside web root
   - With restricted permissions
   - In versioned directory structure
   - Never execute uploaded files

3. **Verify integrity:**
   - Calculate SHA-256 hash
   - Store for later verification
   - Re-verify on access
   - Alert on hash mismatch

4. **Implement quotas:**
   - Per-user upload limits
   - Total storage limits
   - Rate limiting on endpoints

### For Dependency Management

1. **Always commit lock files:**
   ```bash
   git add package-lock.json
   git commit -m "chore: lock dependencies"
   ```

2. **Regular audits:**
   ```bash
   npm audit
   npm outdated
   npm audit fix  # Careful with this
   ```

3. **Review new packages:**
   - Check npm trends
   - Verify maintainer reputation
   - Review recent commits
   - Check for security advisories

4. **Update safely:**
   - Use ^ for minor updates
   - Use ~ for patch updates
   - Never use * or latest in production
   - Test thoroughly after updates

### For Data Integrity

1. **Use transactions for critical operations:**
   ```javascript
   const session = await startTransaction(mongoose.connection);
   try {
     // Multiple operations
     await commitTransaction(session);
   } catch (error) {
     await rollbackTransaction(session);
   }
   ```

2. **Track changes:**
   - Add createdAt, updatedAt timestamps
   - Store previous values
   - Log who made changes

3. **Implement checksums:**
   - Calculate for critical data
   - Verify periodically
   - Alert on mismatches
   - Store separately

4. **Backup and restore:**
   - Regular database backups
   - Test restore procedures
   - Maintain backup integrity
   - Document recovery process

---

## Deployment Checklist

- [ ] package-lock.json committed to git
- [ ] npm audit runs with 0 vulnerabilities
- [ ] No eval() or Function() in codebase
- [ ] Upload directory created and permissions set
- [ ] Database transactions tested
- [ ] Backup and restore procedure documented
- [ ] File upload limits configured
- [ ] Rate limiting on file upload endpoints
- [ ] Dependency audit runs on startup
- [ ] Integrity checks pass on startup
- [ ] Logs monitored for integrity alerts
- [ ] Error handling prevents stack trace leaks

---

## Monitoring & Alerts

**Watch logs for:**
- 🚨 Data tampering detected
- 🚨 File integrity check failed
- 🚨 Dangerous functions found
- ⚠️ Suspicious package patterns
- ⚠️ Missing lock file
- ⚠️ File upload validation failed

**Set up alerts for:**
1. Multiple failed file upload attempts (DoS)
2. Data integrity verification failures
3. Suspicious dependency changes
4. Unexpected eval/Function patterns

---

## Testing

### File Upload Security
```bash
# Test oversized file (should reject)
curl -F "file=@large-file.zip" http://localhost:5000/api/upload

# Test invalid extension (should reject)
curl -F "file=@malware.exe" http://localhost:5000/api/upload

# Test path traversal (should reject)
curl -F "file=@../../etc/passwd" http://localhost:5000/api/upload

# Test valid upload
curl -F "file=@image.jpg" http://localhost:5000/api/upload
```

### Data Integrity
```javascript
// Test in Node.js
import { calculateDataHash, verifyDataIntegrity } from './middleware/dataIntegrity.js';

const data = {name: 'John', email: 'john@test.com'};
const hash = calculateDataHash(data);

console.log('Original hash:', hash);

// Simulate tampering
data.name = 'Jane';
const isTampered = !verifyDataIntegrity(data, hash);
console.log('Data tampered:', isTampered); // true
```

### Dependency Audit
```javascript
// Check dependency status
import { generateDependencyAuditReport } from './middleware/dependencyManagement.js';

const report = generateDependencyAuditReport();
console.log(JSON.stringify(report, null, 2));
```

---

## References

- [OWASP: Software and Data Integrity Failures](https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [Express.js File Upload Security](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated:** November 20, 2025
**Status:** ✅ Fully implemented and integrated
