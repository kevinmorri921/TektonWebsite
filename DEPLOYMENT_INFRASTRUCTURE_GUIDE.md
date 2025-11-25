# Deployment & Infrastructure Guide

## System Requirements

### Minimum Production Environment

```
Frontend (React + Vite)
├─ RAM: 512 MB
├─ CPU: 2 cores (1 GHz)
├─ Disk: 500 MB (node_modules)
├─ Node.js: 18.x LTS or higher
├─ npm: 9.x or higher
└─ Browser: Chrome 90+, Firefox 88+, Safari 14+

Backend (Express.js)
├─ RAM: 1 GB
├─ CPU: 2 cores (2 GHz)
├─ Disk: 500 MB (node_modules + uploads)
├─ Node.js: 18.x LTS or higher
├─ npm: 9.x or higher
└─ Environment: Linux recommended

Database (MongoDB Atlas)
├─ Tier: M1 Shared or higher
├─ RAM: 2 GB
├─ Storage: 10 GB minimum
├─ Backup: Daily snapshots
└─ Regions: US/EU primary + replica

File Storage
├─ Location: /backend/uploads/
├─ Capacity: 10-50 GB (configurable)
├─ Permissions: Read/Write/Execute (755)
└─ Backup: Daily tar.gz snapshots
```

---

## Deployment Checklist

### Pre-Deployment (Development → Staging)

- [ ] **Code Quality**
  - [ ] Run eslint on all files
  - [ ] No console.log statements in production code
  - [ ] No hardcoded credentials/API keys
  - [ ] Comments removed from sensitive sections
  - [ ] Code review completed

- [ ] **Security**
  - [ ] All environment variables documented
  - [ ] Secrets stored in .env (not git)
  - [ ] CORS origins whitelisted
  - [ ] HTTPS enabled (staging)
  - [ ] SSL certificate valid
  - [ ] Security headers configured

- [ ] **Database**
  - [ ] MongoDB Atlas cluster created
  - [ ] Collections created with indexes
  - [ ] Backup strategy enabled
  - [ ] Connection string tested
  - [ ] Atlas IP whitelist configured
  - [ ] Database user created with minimal permissions

- [ ] **API Testing**
  - [ ] All endpoints tested with Postman
  - [ ] Authentication flow verified
  - [ ] File upload tested (valid & invalid files)
  - [ ] Error responses checked
  - [ ] Rate limiting functional
  - [ ] CORS working correctly

- [ ] **Frontend Testing**
  - [ ] Build process verified: `npm run build`
  - [ ] No build errors or warnings
  - [ ] dist/ folder generated
  - [ ] Assets loading correctly
  - [ ] Responsive design verified (mobile, tablet, desktop)
  - [ ] Browser console clear of errors

### Production Deployment

- [ ] **Infrastructure**
  - [ ] Server provisioned (AWS EC2, DigitalOcean, Heroku, etc.)
  - [ ] OS hardened (SSH keys, firewall, fail2ban)
  - [ ] SSL/TLS certificate installed
  - [ ] Domain DNS configured
  - [ ] CDN configured (optional)

- [ ] **Environment**
  - [ ] Node.js LTS installed
  - [ ] npm/yarn installed
  - [ ] PM2 or similar process manager installed
  - [ ] Environment variables set in production
  - [ ] Log rotation configured

- [ ] **Database**
  - [ ] MongoDB Atlas cluster ready
  - [ ] Regular backups enabled
  - [ ] Read replicas configured (high availability)
  - [ ] Monitoring alerts set up

- [ ] **Deployment**
  - [ ] Code cloned from repository
  - [ ] Dependencies installed: `npm install --production`
  - [ ] Build executed: `npm run build` (backend)
  - [ ] Migrations run (if applicable)
  - [ ] Server started via PM2
  - [ ] Health check endpoint responding

- [ ] **Monitoring**
  - [ ] Error tracking configured (Sentry)
  - [ ] Performance monitoring enabled (DataDog, New Relic)
  - [ ] Log aggregation set up (ELK stack, Loggly)
  - [ ] Uptime monitoring enabled
  - [ ] Alert notifications configured

---

## Environment Variables

### Backend (.env)

```env
# Application
NODE_ENV=production
PORT=5000
APP_NAME=TektonWebsite

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=TektonWebsite
ENVIRONMENT=production

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=1d
BCRYPT_ROUNDS=10

# CORS & Security
CORS_ORIGIN=https://yourdomain.com
CORS_METHODS=GET,POST,PUT,DELETE,PATCH
CORS_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf,text/csv,application/json

# Security Headers
HELMET_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_RETENTION_DAYS=30

# Email (Optional - Future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Sentry (Error Tracking)
SENTRY_DSN=https://your-key@sentry.io/project

# Session
SESSION_SECRET=your-session-secret-key
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=Strict
```

### Frontend (.env)

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=30000

# Application
VITE_APP_NAME=Tekton Website
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Sentry
VITE_SENTRY_DSN=https://your-key@sentry.io/project
VITE_SENTRY_ENVIRONMENT=production
```

---

## Process Manager Configuration (PM2)

### File: ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'tekton-backend',
      script: './backend/server.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['logs', 'uploads', 'node_modules'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
    },
  ],
};
```

### Commands

```bash
# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs tekton-backend

# Restart
pm2 restart tekton-backend

# Stop
pm2 stop tekton-backend

# Delete
pm2 delete tekton-backend

# Save startup
pm2 startup
pm2 save
```

---

## Nginx Reverse Proxy Configuration

### File: /etc/nginx/sites-available/tekton

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # Static files (React dist)
    location / {
        root /var/www/tekton/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Static assets (long cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/tekton/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Large file uploads
        client_max_body_size 10M;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

## GitHub Actions CI/CD Pipeline

### File: .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Build backend
        run: cd backend && npm install
      
      - name: Build frontend
        run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/tekton
            git pull origin main
            npm install
            npm run build
            pm2 restart tekton-backend
```

---

## Backup Strategy

### Database Backup

```bash
# Manual backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" --out=./backups/$(date +%Y%m%d)

# Automated backup (cron job)
0 2 * * * mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" --out=/backups/$(date +\%Y\%m\%d) && gzip -r /backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" --dir=./backups/20250101
```

### File Backup

```bash
# Manual backup
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz backend/uploads/

# Automated backup (cron job - 3 AM daily)
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/tekton/backend/uploads/

# Retention policy (keep last 30 days)
find /backups -name "uploads_*.tar.gz" -mtime +30 -delete
```

---

## Monitoring & Alerts

### Health Check Endpoint

```javascript
// backend/routes/health.js
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'PENDING',
      memory: 'OK',
      disk: 'OK',
    },
  };

  // Quick DB check
  User.countDocuments()
    .then(() => {
      health.checks.database = 'OK';
      res.status(200).json(health);
    })
    .catch(() => {
      health.checks.database = 'DOWN';
      res.status(503).json(health);
    });
});
```

### Uptime Monitoring

```bash
# Using cURL in cron (every 5 minutes)
*/5 * * * * curl -X GET https://yourdomain.com/health -f || echo "Service Down" | mail -s "Alert" admin@example.com

# Using Uptime Robot (recommended)
# 1. Create account at uptimerobot.com
# 2. Add monitor: https://yourdomain.com/health
# 3. Set frequency: 5 minutes
# 4. Configure alerts: Email, SMS, Slack
```

---

## Scaling Strategy

### Horizontal Scaling

```
Scenario: Single server → Multiple servers

Current:
┌─────────────────────┐
│  Server 1           │
│  ├─ Frontend        │
│  ├─ Backend (4 CPU) │
│  └─ Uploads         │
└─────────────────────┘

Scaled:
                    ┌────────────────────────┐
                    │  Load Balancer (Nginx) │
                    └─────┬──────────────────┘
                          │
            ┌─────────────┼──────────────┐
            │             │              │
            ▼             ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ Server 1   │ │ Server 2   │ │ Server 3   │
    │ Backend    │ │ Backend    │ │ Backend    │
    │ (4 procs)  │ │ (4 procs)  │ │ (4 procs)  │
    └────────────┘ └────────────┘ └────────────┘
            │             │              │
            └─────────────┼──────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
    ┌──────────────┐            ┌──────────────────┐
    │ Shared Storage│            │ MongoDB Atlas    │
    │ (NFS/S3)      │            │ (Cluster)        │
    └──────────────┘            └──────────────────┘
                                      │
                        ┌─────────────┼──────────────┐
                        │             │              │
                        ▼             ▼              ▼
                    Primary        Replica 1     Replica 2
```

---

## Disaster Recovery Plan

### RTO & RPO Targets

```
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes

Action Plan:
├─ Detect outage (5 min)
│  └─ Uptime monitoring alerts
│
├─ Assess damage (10 min)
│  ├─ Check server status
│  ├─ Check database connectivity
│  └─ Check file storage
│
├─ Restore from backup (30 min)
│  ├─ If DB issue: Restore from MongoDB backup
│  ├─ If file issue: Restore uploads from tar.gz
│  └─ If server issue: Spin up new EC2 instance
│
└─ Verify & communicate (10 min)
   ├─ Run health checks
   ├─ Verify data integrity
   └─ Notify stakeholders
```

---

**Document Version:** 1.0  
**Date:** November 25, 2025  
**Status:** Deployment Reference
