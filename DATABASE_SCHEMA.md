# System Information Database Schema

## MongoDB Collection: `systeminfos`

### Document Structure

```javascript
{
  _id: ObjectId,
  
  // User Association
  userId: ObjectId (indexed, required),
  
  // Network Information
  ipAddress: String (default: "N/A"),
  
  // Operating System
  os: String (default: "N/A"),
  // Values: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "N/A"
  
  // Browser Information
  browser: {
    name: String (default: "N/A"),
    // Values: "Chrome" | "Firefox" | "Safari" | "Edge" | "N/A"
    version: String (default: "N/A")
    // Examples: "120.0.0", "121.0.0", etc.
  },
  
  // Display Information
  screenResolution: String (default: "N/A"),
  // Examples: "1920x1080", "1366x768", "375x667"
  
  // Device Classification
  deviceType: String (default: "N/A"),
  // Values: "Desktop" | "Tablet" | "Mobile" | "N/A"
  
  // Processor Information
  cpuArchitecture: String (default: "N/A"),
  // Examples: "8 cores", "4 cores", "N/A"
  
  // Language & Location
  language: String (default: "N/A"),
  // Examples: "en-US", "fr-FR", "de-DE"
  
  timezone: String (default: "N/A"),
  // Examples: "America/New_York", "Europe/London", "Asia/Tokyo"
  
  // Network Quality
  networkType: String (default: "N/A"),
  // Values: "4g" | "3g" | "2g" | "unknown" | "N/A"
  
  // Hardware Resources
  ram: String (default: "N/A"),
  // Examples: "16GB", "8GB", "4GB", "N/A"
  
  // Graphics Information
  gpu: String (default: "N/A"),
  // Examples: "ANGLE (Intel HD Graphics)", "Intel Iris Pro", "N/A"
  
  // User Agent String
  userAgent: String (default: "N/A"),
  // Full browser identification string
  
  // Metadata
  timestamp: Date (required),
  // When user collected this data
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Indexes

```javascript
// Index 1: Fast queries by user and time
db.systeminfos.createIndex({ userId: 1, timestamp: -1 });

// Index 2: Aggregation on OS
db.systeminfos.createIndex({ os: 1 });

// Index 3: Aggregation on device type
db.systeminfos.createIndex({ deviceType: 1 });
```

**Why these indexes?**
- `userId + timestamp`: Quick retrieval of user's history
- `os`: Fast group-by queries for OS statistics
- `deviceType`: Fast group-by queries for device statistics

---

## Aggregation Pipelines

### OS Usage Statistics
```javascript
db.systeminfos.aggregate([
  { $group: { _id: "$os", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

**Output:**
```json
[
  { "_id": "Windows", "count": 45 },
  { "_id": "macOS", "count": 23 },
  { "_id": "Linux", "count": 12 }
]
```

---

### Browser Usage Statistics
```javascript
db.systeminfos.aggregate([
  { $group: { _id: "$browser.name", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

**Output:**
```json
[
  { "_id": "Chrome", "count": 50 },
  { "_id": "Firefox", "count": 18 },
  { "_id": "Safari", "count": 10 }
]
```

---

### Device Type Usage Statistics
```javascript
db.systeminfos.aggregate([
  { $group: { _id: "$deviceType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

**Output:**
```json
[
  { "_id": "Desktop", "count": 55 },
  { "_id": "Mobile", "count": 13 },
  { "_id": "Tablet", "count": 10 }
]
```

---

### Network Type Usage Statistics
```javascript
db.systeminfos.aggregate([
  { $group: { _id: "$networkType", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

**Output:**
```json
[
  { "_id": "4g", "count": 40 },
  { "_id": "3g", "count": 28 },
  { "_id": "2g", "count": 5 }
]
```

---

### Top 10 Device Combinations
```javascript
db.systeminfos.aggregate([
  {
    $group: {
      _id: {
        deviceType: "$deviceType",
        os: "$os",
        browser: "$browser.name"
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      deviceType: "$_id.deviceType",
      os: "$_id.os",
      browser: "$_id.browser",
      count: 1
    }
  }
])
```

**Output:**
```json
[
  {
    "deviceType": "Desktop",
    "os": "Windows",
    "browser": "Chrome",
    "count": 28
  },
  {
    "deviceType": "Mobile",
    "os": "iOS",
    "browser": "Safari",
    "count": 15
  }
]
```

---

## Example Documents

### Windows Desktop User with Chrome
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userId": ObjectId("507f1f77bcf86cd799439099"),
  "ipAddress": "192.168.1.100",
  "os": "Windows",
  "browser": {
    "name": "Chrome",
    "version": "120.0.6099.129"
  },
  "screenResolution": "1920x1080",
  "deviceType": "Desktop",
  "cpuArchitecture": "8 cores",
  "language": "en-US",
  "timezone": "America/New_York",
  "networkType": "4g",
  "ram": "16GB",
  "gpu": "ANGLE (Intel HD Graphics 630)",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "timestamp": ISODate("2025-11-27T10:30:00Z"),
  "createdAt": ISODate("2025-11-27T10:30:00Z"),
  "updatedAt": ISODate("2025-11-27T10:30:00Z")
}
```

### Mobile iOS User with Safari
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439100"),
  "ipAddress": "203.0.113.45",
  "os": "iOS",
  "browser": {
    "name": "Safari",
    "version": "17.1"
  },
  "screenResolution": "390x844",
  "deviceType": "Mobile",
  "cpuArchitecture": "6 cores",
  "language": "en-GB",
  "timezone": "Europe/London",
  "networkType": "4g",
  "ram": "6GB",
  "gpu": "Apple GPU",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)...",
  "timestamp": ISODate("2025-11-27T10:31:00Z"),
  "createdAt": ISODate("2025-11-27T10:31:00Z"),
  "updatedAt": ISODate("2025-11-27T10:31:00Z")
}
```

---

## Database Operations

### Insert a new record
```javascript
db.systeminfos.insertOne({
  userId: ObjectId("..."),
  ipAddress: "192.168.1.1",
  os: "Windows",
  browser: { name: "Chrome", version: "120.0" },
  // ... other fields
  timestamp: new Date()
})
```

### Find all records for a user
```javascript
db.systeminfos.find({ userId: ObjectId("...") }).sort({ timestamp: -1 })
```

### Count total records
```javascript
db.systeminfos.countDocuments()
```

### Get records from last 30 days
```javascript
db.systeminfos.find({
  timestamp: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
})
```

### Delete old records (>90 days)
```javascript
db.systeminfos.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

---

## Backup Considerations

**Retention Policy Recommendations:**
- Keep last 90 days of data
- Archive older data monthly
- Clean up consent records quarterly

**Size Estimates:**
- Average document: ~1.5 KB
- 1000 records: ~1.5 MB
- 100,000 records: ~150 MB
- Annual (daily collection): ~550 MB

---

## Performance Tips

1. **Regular Index Maintenance**
   ```javascript
   db.systeminfos.reIndex()
   ```

2. **Archive Old Data**
   ```javascript
   // Move data older than 90 days to archive collection
   db.systeminfos_archive.insertMany(
     db.systeminfos.find({ timestamp: { $lt: cutoffDate } }).toArray()
   )
   db.systeminfos.deleteMany({ timestamp: { $lt: cutoffDate } })
   ```

3. **Monitor Collection Size**
   ```javascript
   db.systeminfos.stats()
   ```

4. **Connection Pooling**
   - Ensure MongoDB connection pool is configured (default 100)

---

## Integration with Backend

The `systemInfo.js` model automatically:
- Creates indexes on collection creation
- Validates data types
- Provides aggregation helpers
- Timestamps all records

**No manual database setup required!** Mongoose handles everything.

---

## Compliance Notes

- **GDPR:** Data is user-associated; include user consent
- **CCPA:** Allow data deletion per user
- **HIPAA:** Not PHI; safe to store
- **SOC2:** Audit trail maintained via timestamps

For data deletion request:
```javascript
db.systeminfos.deleteMany({ userId: ObjectId("...") })
```

---

## Monitoring Queries

### Check collection growth
```javascript
db.systeminfos.aggregate([
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  { $sort: { _id: -1 } },
  { $limit: 30 }
])
```

### Find anomalies
```javascript
db.systeminfos.find({
  $or: [
    { os: "N/A" },
    { browser: { name: "N/A" } },
    { screenResolution: "N/A" }
  ]
})
```

---

**Database ready for production!** 🎉
