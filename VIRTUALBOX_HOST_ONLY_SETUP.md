# Windows Server on VirtualBox with Host-Only Adapter - Complete Setup Guide

## Overview
You have a **Host-Only Adapter** setup with:
- ✅ **AD DS (Active Directory Domain Services)** - Domain controller
- ✅ **DHCP Server** - Automatic IP assignment
- ✅ **DNS Server** - Name resolution
- ✅ **IIS** - Web server already installed

This is a **professional enterprise setup**! This guide optimizes for your configuration.

---

## Table of Contents
1. [Host-Only Network Architecture](#host-only-network-architecture)
2. [Verify DHCP/DNS Configuration](#verify-dhcpdns-configuration)
3. [Get Windows Server IP Address](#get-windows-server-ip-address)
4. [Install Remaining Software](#install-remaining-software)
5. [Deploy Tekton Website](#deploy-tekton-website)
6. [Configure IIS](#configure-iis)
7. [Access from Host Computer](#access-from-host-computer)
8. [Troubleshooting](#troubleshooting)

---

## Step 1: Host-Only Network Architecture

### 1.1 Understand Your Setup

```
┌──────────────────────────┐
│  Your Local Computer     │
│  (Host Machine)          │
│  Windows/Mac/Linux       │
│                          │
│  IP: 192.168.56.1        │
│  (Host-only adapter)     │
└──────────┬───────────────┘
           │
    Host-Only Network
    (VirtualBox Internal)
           │
┌──────────▼───────────────┐
│ Windows Server VM        │
│ (VirtualBox Guest)       │
│                          │
│ Domain: your.local       │
│ IP: 192.168.56.X         │
│ (Assigned by DHCP)       │
│                          │
│ Services Running:        │
│ • AD DS (Domain Control) │
│ • DHCP (IP Assignment)   │
│ • DNS (Name Resolution)  │
│ • IIS (Web Server)       │
└──────────────────────────┘
```

### 1.2 Host-Only Adapter Benefits

✅ **Isolated network** - Only your computer can access VM  
✅ **Domain setup** - AD DS works perfectly  
✅ **DHCP enabled** - Automatic IP assignment  
✅ **DNS enabled** - Internal domain names work  
✅ **Secure** - No external access  
✅ **Testing** - Perfect for development/testing  

### 1.3 Verify Host-Only Adapter in VirtualBox

**On your HOST computer:**

1. Open **Oracle VirtualBox**
2. Go to **Tools** (top menu) → **Network**
3. Look for **vboxnet0** (or similar)
4. It should show:
   - IPv4 Address: `192.168.56.1`
   - DHCP Server: ✅ Enabled
5. If not enabled, click the adapter → **Edit** → enable DHCP

---

## Step 2: Verify DHCP/DNS Configuration

### 2.1 Check DHCP on Windows Server VM

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Get DHCP server info
Get-DhcpServerv4Scope

# Should show active scope like:
# ScopeId: 192.168.56.0
# State: Active
# StartRange: 192.168.56.100
# EndRange: 192.168.56.254
```

### 2.2 Check DNS on Windows Server VM

```powershell
# Check DNS is running
Get-Service DNS

# Output should show: Running

# List DNS zones
Get-DnsServerZone

# Should show your domain zone (e.g., "your.local")
```

### 2.3 Check Domain Controller Status

```powershell
# Verify AD DS is working
Get-ADDomain

# Should show domain info like:
# Name: your.local
# Forest: your.local
# DomainMode: 10.0 (2016 or higher)
```

**If any service is stopped, start them:**

```powershell
# Start DHCP
Start-Service DHCP

# Start DNS
Start-Service DNS

# Start AD DS (automatic, but verify)
Get-Service NTDS
```

---

## Step 3: Get Windows Server IP Address

### 3.1 Find VM's IP from VirtualBox DHCP

**In Windows Server VM (PowerShell):**

```powershell
ipconfig

# Look for Host-Only Adapter section:
# Ethernet adapter VirtualBox Host-Only Network:
# IPv4 Address: 192.168.56.XXX
# Default Gateway: 192.168.56.1
# DHCP Enabled: Yes

# Write down this IP (e.g., 192.168.56.101)
```

### 3.2 Set Static IP (Optional but Recommended)

For a web server, static IP is better than DHCP.

```powershell
# Get current network interface
Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*VirtualBox*"}

# Set static IP
New-NetIPAddress -InterfaceAlias "Ethernet" `
  -IPAddress 192.168.56.10 `
  -PrefixLength 24 `
  -DefaultGateway 192.168.56.1

# Set DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" `
  -ServerAddresses "192.168.56.10"
```

**Or use GUI:**
1. Settings → Network → Adapter
2. IPv4 Settings
3. Static: `192.168.56.10`
4. Gateway: `192.168.56.1`
5. DNS: `192.168.56.10`

### 3.3 Create DNS Record for Web Server

```powershell
# Add DNS A record (admin zone)
Add-DnsServerResourceRecordA -ZoneName "your.local" `
  -Name "tekton" `
  -IPv4Address "192.168.56.10" `
  -TimeToLive 3600

# Add API subdomain
Add-DnsServerResourceRecordA -ZoneName "your.local" `
  -Name "api" `
  -IPv4Address "192.168.56.10" `
  -TimeToLive 3600

# Verify records were created
Get-DnsServerResourceRecord -ZoneName "your.local" -Name "tekton"
```

**Now you can use:**
- `http://tekton.your.local` - Frontend
- `http://api.your.local:5000` - Backend

---

## Step 4: Install Remaining Software

### 4.1 Verify IIS is Installed

**In Windows Server VM (PowerShell):**

```powershell
# Check IIS service
Get-Service W3SVC

# Should show: Running

# Open IIS Manager
inetmgr

# Should open IIS Manager window
```

**If not running:**

```powershell
Start-Service W3SVC
```

### 4.2 Install Node.js LTS

**In Windows Server VM:**

1. Download Node.js from [nodejs.org](https://nodejs.org)
   - Click **LTS** (v20.10.0 or latest)
   - Download **Windows Installer (.msi) 64-bit**
2. Run installer as Administrator
3. Accept all defaults
4. **Restart PowerShell** after installation

**Verify:**

```powershell
node --version
npm --version
```

### 4.3 Install Git

**In Windows Server VM:**

1. Download from [git-scm.com](https://git-scm.com)
2. Download **Git for Windows (64-bit)**
3. Run installer as Administrator
4. Accept defaults during installation
5. **Restart PowerShell**

**Verify:**

```powershell
git --version
```

### 4.4 Install iisnode

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Install globally
npm install -g iisnode

# Verify
iisnode --version

# Check installation location
where iisnode
```

### 4.5 Install Visual C++ Redistributable

**In Windows Server VM:**

1. Download from [Microsoft](https://support.microsoft.com/en-us/help/2977003)
2. Download **vc_redist.x64.exe** (64-bit)
3. Run as Administrator
4. Accept defaults

---

## Step 5: Deploy Tekton Website

### 5.1 Create Deployment Folder

**In Windows Server VM (PowerShell):**

```powershell
# Create folder structure
mkdir "C:\inetpub\tekton-website"
mkdir "C:\inetpub\tekton-website\backend"
mkdir "C:\inetpub\tekton-website\frontend"
mkdir "C:\inetpub\tekton-website\logs"
mkdir "C:\inetpub\tekton-website\uploads"

# Verify
Get-ChildItem "C:\inetpub\tekton-website"
```

### 5.2 Set Folder Permissions

```powershell
# For IIS to access
$path = "C:\inetpub\tekton-website"
$acl = Get-Acl $path

# Give NETWORK SERVICE full control
$permission = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "NETWORK SERVICE",
    "FullControl",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)

$acl.SetAccessRule($permission)
Set-Acl -Path $path -AclObject $acl
```

### 5.3 Clone Project with Git

**In Windows Server VM (PowerShell):**

```powershell
cd C:\inetpub\tekton-website

# Clone from GitHub
git clone https://github.com/kevinmorri921/TektonWebsite.git .

# Verify
ls
# Should show: backend, src, package.json, etc.
```

### 5.4 Install Dependencies

**In Windows Server VM (PowerShell):**

```powershell
cd C:\inetpub\tekton-website

# Install backend dependencies
cd backend
npm install

# Back to root
cd ..

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Verify dist folder created
ls dist
# Should show: index.html, assets, etc.
```

---

## Step 6: Configure IIS

### 6.1 Create Application Pool

**In Windows Server VM:**

1. Open **IIS Manager** (type `inetmgr.exe` in search)
2. Right-click **Application Pools** → **Add Application Pool**
   - **Name:** `TektonAppPool`
   - **.NET CLR Version:** No Managed Code
   - **Managed Pipeline Mode:** Integrated
3. Click **OK**
4. Right-click the pool → **Advanced Settings:**
   - **Start Mode:** `AlwaysRunning`
   - **Idle Time-out:** `0`
5. Right-click pool → **Start**

### 6.2 Create Backend Application

**In IIS Manager:**

1. Right-click **Sites** → **Add Website**
   - **Site name:** `TektonAPI`
   - **Application pool:** `TektonAppPool`
   - **Physical path:** `C:\inetpub\tekton-website\backend`
   - **Host name:** `api.tekton.your.local`
   - **Port:** `5000`
2. Click **OK**

### 6.3 Add iisnode Handler to Backend

1. **Select TektonAPI site** in IIS Manager
2. **Double-click "Handler Mappings"**
3. **Right-click → Add Module Mapping**
   - **Request path:** `*.js`
   - **Module:** `iisnode`
   - **Executable:** `C:\Program Files\iisnode\iisnode.exe`
   - **Name:** `iisnode`
4. Click **OK**

### 6.4 Create backend web.config

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

### 6.5 Create Frontend Website

1. Right-click **Sites** → **Add Website**
   - **Site name:** `TektonWeb`
   - **Application pool:** `TektonAppPool`
   - **Physical path:** `C:\inetpub\tekton-website\dist`
   - **Host name:** `tekton.your.local`
   - **Port:** `80`
2. Click **OK**

### 6.6 Create frontend web.config

**File: `C:\inetpub\tekton-website\dist\web.config`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
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
    </staticContent>
  </system.webServer>
</configuration>
```

---

## Step 7: Create .env Configuration

### 7.1 Backend .env File

**File: `C:\inetpub\tekton-website\backend\.env`**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://tekton_user:PASSWORD@cluster.mongodb.net/tekton?retryWrites=true&w=majority
JWT_SECRET=your_very_secret_key_minimum_32_characters_long
JWT_EXPIRY=7d
UPLOAD_DIR=C:\inetpub\tekton-website\backend\uploads
LOG_DIR=C:\inetpub\tekton-website\logs
DOMAIN=your.local
```

### 7.2 Update Frontend Environment

**File: `C:\inetpub\tekton-website\.env.production`**

```env
VITE_API_URL=http://api.tekton.your.local:5000
VITE_APP_NAME=Tekton Website
VITE_DOMAIN=your.local
```

### 7.3 Rebuild Frontend

```powershell
cd C:\inetpub\tekton-website

npm run build

# Verify dist folder updated
ls dist
```

---

## Step 8: Configure CORS and Backend

### 8.1 Update CORS Settings

**File: `backend/middleware/securityConfig.js`**

```javascript
const cors = require('cors');

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://tekton.your.local",
  "http://api.tekton.your.local:5000",
  "http://192.168.56.10",
  "http://192.168.56.1"  // Host computer
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

### 8.2 Restart IIS

```powershell
iisreset /restart

# Verify services running
Get-Service W3SVC
Get-Service NTDS
Get-Service DNS
Get-Service DHCP
```

---

## Step 9: Access from Host Computer

### 9.1 Find Host-Only IP on Your Computer

**On your LOCAL computer (Windows):**

```powershell
# Open Command Prompt or PowerShell
ipconfig

# Look for: VirtualBox Host-Only Ethernet Adapter
# IPv4 Address: 192.168.56.1
```

### 9.2 Test Connection from Host

**On your LOCAL computer:**

```powershell
# Ping the server
ping 192.168.56.10

# Should get replies

# Try DNS name (after DNS replication)
ping tekton.your.local
```

### 9.3 Access Website in Browser

**On your LOCAL computer - Open browser and visit:**

```
http://tekton.your.local
```

Or using IP:

```
http://192.168.56.10
```

### 9.4 Test Backend API

```powershell
# On your local computer
curl http://api.tekton.your.local:5000/api/events

# Or with IP
curl http://192.168.56.10:5000/api/events
```

---

## Step 10: Create Domain User for Tekton

### 10.1 Create User in Active Directory

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Create new AD user
New-ADUser -Name "tekton-user" `
  -SamAccountName "tekton-user" `
  -UserPrincipalName "tekton-user@your.local" `
  -EmailAddress "tekton@your.local" `
  -AccountPassword (ConvertTo-SecureString -AsPlainText "TektonPassword123!" -Force) `
  -Enabled $true

# Verify user created
Get-ADUser -Filter {SamAccountName -eq "tekton-user"}
```

### 10.2 Add to Application Pool Identity

**In IIS Manager:**

1. Right-click **TektonAppPool** → **Advanced Settings**
2. Under **Process Model** section:
   - **Identity:** Custom Account
   - Click the **...** button
   - Select **Set...**
   - Username: `your.local\tekton-user`
   - Password: `TektonPassword123!`
3. Click **OK**

---

## Step 11: Testing

### 11.1 Test from Windows Server VM

```powershell
# Test backend
curl http://localhost:5000/api/events

# Should return data or empty array
```

### 11.2 Test from Host Computer

**On your local computer:**

1. Open browser
2. Go to: `http://tekton.your.local`
3. Should see login page
4. Try signup
5. Fill in test data
6. Submit

### 11.3 Check IIS Logs

**On Windows Server:**

```powershell
# View recent requests
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\u_ex*.log" -Tail 50
```

### 11.4 Test API Connection

```powershell
# From Windows Server
curl -i http://localhost:5000/api/events

# From your local computer
curl -i http://api.tekton.your.local:5000/api/events

# Both should return 200 OK with data
```

---

## Command Reference

### Essential PowerShell Commands

```powershell
# Check services
Get-Service W3SVC
Get-Service DHCP
Get-Service DNS
Get-Service NTDS

# Start services
Start-Service W3SVC
Start-Service DHCP

# Restart IIS
iisreset /restart

# Manage app pool
Start-IISAppPool -Name "TektonAppPool"
Stop-IISAppPool -Name "TektonAppPool"
Restart-IISAppPool -Name "TektonAppPool"

# Check DNS records
Get-DnsServerResourceRecord -ZoneName "your.local"

# Check DHCP scope
Get-DhcpServerv4Scope

# Pull latest code
cd C:\inetpub\tekton-website
git pull origin main

# Rebuild and restart
npm run build
iisreset /restart
```

---

## Troubleshooting

### Issue: DNS Name Not Resolving

**Solution:**
```powershell
# On Windows Server VM
Get-DnsServerResourceRecord -ZoneName "your.local"

# If missing, add:
Add-DnsServerResourceRecordA -ZoneName "your.local" `
  -Name "tekton" `
  -IPv4Address "192.168.56.10"

# On your host computer, clear DNS cache
ipconfig /flushdns
```

### Issue: Can't Access Website from Host

**Solution:**
1. Check firewall in Windows Server:
   ```powershell
   Get-NetFirewallProfile -Policy Public
   # Should show Enabled: False (for testing)
   ```

2. Verify IIS is running:
   ```powershell
   Get-Service W3SVC
   ```

3. Test locally first:
   ```powershell
   curl http://localhost
   ```

4. Check binding in IIS:
   - IIS Manager → Sites → TektonWeb → Edit Binding
   - Should show port 80

### Issue: DHCP Not Assigning IP

**Solution:**
```powershell
# Verify DHCP is running
Get-Service DHCP

# Check scope
Get-DhcpServerv4Scope

# Renew DHCP lease
ipconfig /release
ipconfig /renew
```

### Issue: Port 5000 in Use

**Solution:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change port in IIS binding
```

### Issue: CORS Errors

**Solution:**
1. Verify CORS middleware is updated
2. Check allowedOrigins includes your host IP
3. Test with curl first:
   ```powershell
   curl -H "Origin: http://tekton.your.local" http://api.tekton.your.local:5000/api/events
   ```

---

## Network Testing Checklist

- [ ] Host-Only Adapter enabled in VirtualBox
- [ ] DHCP server running on Windows Server
- [ ] DNS server running on Windows Server
- [ ] AD DS domain operational
- [ ] Static IP set (optional but recommended)
- [ ] DNS A records created for tekton and api
- [ ] Node.js installed and working
- [ ] Git installed and working
- [ ] IIS Manager opens successfully
- [ ] TektonAppPool created and running
- [ ] Backend site (TektonAPI) created
- [ ] Frontend site (TektonWeb) created
- [ ] web.config files in place
- [ ] IIS Handler Mappings configured for iisnode
- [ ] Can ping server from host computer
- [ ] Can access website in browser
- [ ] API returns data
- [ ] Signup form works

---

## 🎯 Production Checklist

- [ ] All services verified running
- [ ] Static IP configured
- [ ] DNS records propagated
- [ ] IIS bindings correct
- [ ] web.config files in place
- [ ] CORS configuration updated
- [ ] Frontend built and deployed
- [ ] Backend dependencies installed
- [ ] MongoDB connected (Atlas or local)
- [ ] Application pool identity set
- [ ] Firewall configured
- [ ] Tests passing
- [ ] Ready for users!

**Your system is ready for deployment! 🚀**

---

## Support & Next Steps

1. **Monitor IIS logs** for any errors
2. **Test all user features** (signup, login, upload, delete)
3. **Set up automated backups** of your VM
4. **Document DNS entries** created
5. **Keep AD DS healthy** with regular maintenance

For AD DS help: [microsoft.com/AD](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/ad-ds-deployment-guide)
