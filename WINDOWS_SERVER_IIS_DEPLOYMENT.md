# Tekton Website System - Windows Server IIS Deployment Guide

## Overview
This guide explains how to deploy your full-stack Tekton Website system on **Windows Server using IIS (Internet Information Services)**.

- **Frontend:** React/Vite → IIS Static Site
- **Backend:** Node.js/Express → IIS Application with Node
- **Database:** MongoDB (local or Atlas)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Windows Server Setup](#windows-server-setup)
3. [Install Required Software](#install-required-software)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [IIS Configuration](#iis-configuration)
7. [SSL/HTTPS Setup](#ssltls-setup)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- [ ] Windows Server 2016 or later (2019, 2022 recommended)
- [ ] Administrator access to Windows Server
- [ ] Node.js installed (v16+ LTS)
- [ ] Git installed
- [ ] MongoDB (local or MongoDB Atlas account)
- [ ] Your TektonWebsite project files

### Optional but Recommended
- [ ] SSL Certificate (self-signed or trusted CA)
- [ ] Domain name or server IP address
- [ ] Backup of current system

---

## Step 1: Windows Server Setup

### 1.1 Enable IIS

**Open PowerShell as Administrator:**
```powershell
# Option A: Using PowerShell (Recommended)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
```

**Option B: Using Server Manager GUI:**
1. Open **Server Manager**
2. Click **Add Roles and Features**
3. Select **Web Server (IIS)** role
4. Include features:
   - Web Server
   - WebSocket Protocol
   - Application Development
   - .NET Framework 4.8
5. Click **Install**

### 1.2 Verify IIS Installation

```powershell
# Check if IIS is running
Get-Service W3SVC

# Start IIS if not running
Start-Service W3SVC
```

### 1.3 Open Windows Firewall for IIS

```powershell
# Allow HTTP (Port 80)
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=tcp localport=80

# Allow HTTPS (Port 443)
netsh advfirewall firewall add rule name="Allow HTTPS" dir=in action=allow protocol=tcp localport=443

# Allow Node.js backend (Port 5000)
netsh advfirewall firewall add rule name="Allow Node.js" dir=in action=allow protocol=tcp localport=5000
```

---

## Step 2: Install Required Software

### 2.1 Install Node.js

1. Download from [nodejs.org](https://nodejs.org) (LTS version)
2. Run installer as Administrator
3. Accept defaults (includes npm)
4. **Verify installation:**

```powershell
node --version
npm --version
```

### 2.2 Install URL Rewrite Module

1. Download from [Microsoft IIS URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Run installer as Administrator
3. Follow installation wizard

### 2.3 Install Web Platform Installer (Optional but Helpful)

1. Download from [Web Platform Installer](https://www.microsoft.com/web/downloads/platform.aspx)
2. Useful for installing additional IIS modules

---

## Step 3: Prepare Your Project

### 3.1 Copy Project to Server

**On Windows Server, create deployment directory:**

```powershell
# Create folder structure
mkdir "C:\inetpub\tekton-website"
mkdir "C:\inetpub\tekton-website\backend"
mkdir "C:\inetpub\tekton-website\frontend"
mkdir "C:\inetpub\tekton-website\logs"

# Copy your project files (use Git or file transfer)
cd "C:\inetpub\tekton-website"
git clone https://github.com/kevinmorri921/TektonWebsite.git .
```

### 3.2 Set Folder Permissions

**Right-click folders → Properties → Security:**

1. **Full permissions for:**
   - IIS AppPool identity user
   - NETWORK SERVICE
   - SYSTEM

**Or via PowerShell:**

```powershell
$path = "C:\inetpub\tekton-website"
$user = "IIS AppPool\TektonAppPool"  # Will create this later

# Grant permissions
$acl = Get-Acl $path
$permission = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $user,
    [System.Security.AccessControl.FileSystemRights]::FullControl,
    [System.Security.AccessControl.InheritanceFlags]"ContainerInherit, ObjectInherit",
    [System.Security.AccessControl.PropagationFlags]::None,
    [System.Security.AccessControl.AccessControlType]::Allow
)
$acl.SetAccessRule($permission)
Set-Acl -Path $path -AclObject $acl
```

---

## Step 4: Backend Deployment (Node.js/Express)

### 4.1 Install Dependencies

```powershell
cd "C:\inetpub\tekton-website\backend"

# Install npm packages
npm install

# Verify installation
npm list
```

### 4.2 Create .env File for Backend

**File: `C:\inetpub\tekton-website\backend\.env`**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://tekton_user:PASSWORD@cluster.mongodb.net/tekton?retryWrites=true&w=majority
JWT_SECRET=your_very_secret_key_minimum_32_characters_long
JWT_EXPIRY=7d
UPLOAD_DIR=C:\inetpub\tekton-website\backend\uploads
LOG_DIR=C:\inetpub\tekton-website\logs
```

### 4.3 Create Directories

```powershell
# Create uploads and logs directories
mkdir "C:\inetpub\tekton-website\backend\uploads"
mkdir "C:\inetpub\tekton-website\logs"
```

### 4.4 Test Backend Locally

```powershell
cd "C:\inetpub\tekton-website\backend"

# Start server
node server.js

# Should see: "Server is running on port 5000"
```

Press `Ctrl+C` to stop.

### 4.5 Install IIS Node Module

This allows IIS to run Node.js applications:

```powershell
# Install iisnode
npm install -g iisnode

# Verify
iisnode --version
```

---

## Step 5: Frontend Deployment (React/Vite)

### 5.1 Build React for Production

```powershell
cd "C:\inetpub\tekton-website"

# Install dependencies
npm install

# Build React (creates dist folder)
npm run build

# Output should show: "✓ 9xxx files built in 12.3s"
```

### 5.2 Copy Built Files

```powershell
# The dist folder contains your optimized frontend
# It will be deployed to IIS in the next step

# Verify dist folder exists
ls "C:\inetpub\tekton-website\dist"
```

---

## Step 6: IIS Configuration

### 6.1 Create IIS Application Pool

**Open IIS Manager (inetmgr.exe):**

1. **Right-click "Application Pools"** → **Add Application Pool**
   - **Name:** `TektonAppPool`
   - **.NET CLR version:** No Managed Code
   - **Managed pipeline mode:** Integrated
   - Click **OK**

2. **Select the pool** → **Advanced Settings:**
   - **Start Mode:** AlwaysRunning
   - **Idle Time-out:** 0 (never timeout)
   - Click **OK**

3. **Start the Application Pool:**
   - Right-click pool → **Start**

### 6.2 Create Backend Website/Application in IIS

**In IIS Manager:**

1. **Right-click "Sites"** → **Add Website**
   - **Site name:** `TektonAPI`
   - **Application pool:** `TektonAppPool`
   - **Physical path:** `C:\inetpub\tekton-website\backend`
   - **Host name:** `api.tekton.local` (or your server name)
   - **Port:** `5000`
   - Click **OK**

### 6.3 Add iisnode Handler

1. **Select TektonAPI site**
2. **Double-click "Handler Mappings"**
3. **Right-click → Add Module Mapping**
   - **Request path:** `*.js`
   - **Module:** `iisnode`
   - **Executable:** `C:\Program Files\iisnode\iisnode.exe`
   - **Name:** `iisnode`
   - Click **OK**

### 6.4 Configure web.config for Backend

**File: `C:\inetpub\tekton-website\backend\web.config`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode 
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
    />
  </system.webServer>
</configuration>
```

### 6.5 Create Frontend Website in IIS

1. **Right-click "Sites"** → **Add Website**
   - **Site name:** `TektonWeb`
   - **Application pool:** `TektonAppPool`
   - **Physical path:** `C:\inetpub\tekton-website\dist`
   - **Host name:** `tekton.local` (or your server name)
   - **Port:** `80`
   - Click **OK**

### 6.6 Configure web.config for Frontend

**File: `C:\inetpub\tekton-website\dist\web.config`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Rewrite all requests to index.html for React routing -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchList" trackAllCaptures="false">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeType fileExtension=".json" mimeType="application/json" />
      <mimeType fileExtension=".wasm" mimeType="application/wasm" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET,PUT,POST,DELETE,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

---

## Step 7: Update API URLs in Frontend

### 7.1 Update Environment Variables

**File: `C:\inetpub\tekton-website\.env.production`**

```env
VITE_API_URL=http://api.tekton.local:5000
VITE_APP_NAME=Tekton Website
```

### 7.2 Rebuild Frontend

```powershell
cd "C:\inetpub\tekton-website"

# Update config and rebuild
npm run build
```

### 7.3 Copy Updated Files

```powershell
# Copy dist folder to IIS
Copy-Item "C:\inetpub\tekton-website\dist\*" -Destination "C:\inetpub\tekton-website\dist\" -Force
```

---

## Step 8: Configure CORS on Backend

**Update backend CORS settings:**

**File: `backend/middleware/securityConfig.js`**

```javascript
const cors = require('cors');

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://tekton.local",
  "http://api.tekton.local:5000",
  "http://YOUR_SERVER_IP",
  "http://YOUR_SERVER_NAME"
];

module.exports = cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

**Restart backend:**

```powershell
cd "C:\inetpub\tekton-website\backend"
npm install
# Restart in IIS Manager
```

---

## Step 9: SSL/TLS Setup

### 9.1 Generate Self-Signed Certificate (Testing Only)

```powershell
# Generate certificate valid for 365 days
$cert = New-SelfSignedCertificate `
  -DnsName "tekton.local","api.tekton.local" `
  -CertStoreLocation "cert:\LocalMachine\My" `
  -NotAfter (Get-Date).AddDays(365) `
  -KeySpec KeyExchange

echo "Certificate Thumbprint: $($cert.Thumbprint)"
```

### 9.2 Bind SSL Certificate to Sites

**In IIS Manager:**

1. **Select TektonWeb site**
2. **Edit Bindings → Add**
   - Type: `https`
   - Port: `443`
   - SSL Certificate: Select your certificate
   - Click **OK**

3. **Repeat for TektonAPI site**

### 9.3 Redirect HTTP to HTTPS

**In each site's web.config:**

```xml
<rewrite>
  <rules>
    <rule name="HTTP to HTTPS">
      <match url=".*" />
      <conditions>
        <add input="{HTTPS}" pattern="off" />
      </conditions>
      <action type="Redirect" url="https://{HTTP_HOST}{REQUEST_URI}" redirectType="Permanent" />
    </rule>
  </rules>
</rewrite>
```

### 9.4 Add Local DNS Entries (Testing)

**Edit `C:\Windows\System32\drivers\etc\hosts`** (as Administrator):

```
127.0.0.1       tekton.local
127.0.0.1       api.tekton.local
192.168.1.100   tekton.local        # Replace with your server IP
192.168.1.100   api.tekton.local
```

---

## Step 10: Testing & Verification

### 10.1 Test Backend API

```powershell
# Test health check
curl http://api.tekton.local:5000/api/events

# Should return data or empty array
```

### 10.2 Test Frontend Access

Open browser and visit:
```
http://tekton.local
```

Should see the Tekton Website login page.

### 10.3 Check IIS Logs

**Location:** `C:\inetpub\logs\LogFiles`

```powershell
# View recent logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\u_ex*.log" -Tail 50
```

### 10.4 Check Application Event Logs

```powershell
# View IIS errors
Get-EventLog -LogName "Application" -Source "iisnode" -Newest 10
```

### 10.5 Test Form Submission

1. Go to signup page
2. Fill in registration form
3. Submit
4. Verify:
   - Form data sent to backend
   - User created in database
   - Success message displays

---

## Step 11: Production Checklist

- [ ] Node.js installed and working
- [ ] MongoDB connection configured
- [ ] IIS sites created and running
- [ ] web.config files deployed
- [ ] CORS configured correctly
- [ ] API URLs updated in frontend
- [ ] Frontend built and deployed
- [ ] Backend accessible from frontend
- [ ] SSL/HTTPS enabled
- [ ] Windows Firewall rules added
- [ ] Application Pool permissions set
- [ ] Logs accessible and monitored
- [ ] Database backups enabled

---

## Monitoring & Maintenance

### 11.1 Monitor Application Pool

**PowerShell:**

```powershell
# Check app pool status
Get-IISAppPool -Name "TektonAppPool"

# Recycle pool if needed
Restart-IISAppPool -Name "TektonAppPool"

# View running processes
Get-Process node
```

### 11.2 Monitor Database

```powershell
# Check MongoDB connection
# Verify data in MongoDB Atlas or local MongoDB
```

### 11.3 View IIS Logs

```powershell
# Monitor in real-time
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\u_ex$(Get-Date -f yyMMdd).log" -Wait
```

### 11.4 Set Up Automatic Backups

```powershell
# Schedule daily backup script
# Example: Backup-TektonDatabase.ps1

$backupPath = "C:\backups\tekton-$(Get-Date -f yyyyMMdd-HHmmss).zip"
Compress-Archive -Path "C:\inetpub\tekton-website" -DestinationPath $backupPath

Write-Host "Backup created: $backupPath"
```

---

## Troubleshooting

### Issue: Application Pool Crashing

**Solution:**
```powershell
# Check event logs
Get-EventLog -LogName "Application" -Source "iisnode" -Newest 20

# Increase timeout in web.config
# Add to iisnode element:
# <iisnode watchedFiles="*.js;node_modules\*;routes\*.js;views\*.jade" />
```

### Issue: CORS Errors

**Solution:**
- Verify CORS middleware in backend
- Check origin URLs match exactly
- Test with curl first:
  ```powershell
  curl -H "Origin: http://tekton.local" http://api.tekton.local:5000/api/events
  ```

### Issue: 404 on API Routes

**Solution:**
```xml
<!-- Add to backend web.config -->
<rule name="DynamicContent">
  <conditions>
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
  </conditions>
  <action type="Rewrite" url="server.js" />
</rule>
```

### Issue: Frontend Routes Not Working

**Solution:**
Ensure `web.config` has rewrite rule to send all requests to `index.html`

### Issue: Cannot Connect to MongoDB

**Solution:**
```powershell
# Test MongoDB connection
npm install -g mongodb-shell

mongo "mongodb+srv://tekton_user:PASSWORD@cluster.mongodb.net/tekton"
```

### Issue: Port 5000 Already in Use

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

---

## Quick Reference Commands

```powershell
# Start/Stop IIS Services
Start-Service W3SVC
Stop-Service W3SVC
Restart-Service W3SVC

# Manage Application Pools
Start-IISAppPool -Name "TektonAppPool"
Stop-IISAppPool -Name "TektonAppPool"
Restart-IISAppPool -Name "TektonAppPool"

# Restart IIS completely
iisreset /restart

# Check IIS status
Get-Service W3SVC

# View running Node processes
Get-Process node
```

---

## Support & Next Steps

1. **Monitor logs daily** for errors
2. **Test all features** (signup, login, upload, delete)
3. **Set up automated backups**
4. **Document your setup** (IP, DNS, credentials)
5. **Plan disaster recovery** procedures

For additional help:
- IIS Documentation: [microsoft.com/IIS](https://www.iis.net/)
- Node.js on IIS: [github.com/Azure/iisnode](https://github.com/Azure/iisnode)
- MongoDB: [mongodb.com/docs](https://docs.mongodb.com/)
