# Complete Windows Server Deployment Guide - VirtualBox with AD DS, DHCP, DNS, and IIS

## Overview

This guide covers a **professional enterprise setup** for your Tekton Website system:

### Your Infrastructure
- **Virtualization:** Oracle VirtualBox
- **Guest OS:** Windows Server (2016, 2019, 2022)
- **Services Installed:** AD DS, DHCP, DNS, IIS
- **Network Setup:** 
  - 🟢 **Host-Only Adapter** (Local network - your computer ↔ VM)
  - 🌐 **NAT Adapter** (Internet access - VM downloads packages)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Local Computer                      │
│                   (Host Machine)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Host-Only Network (192.168.56.0/24)               │   │
│  │  • Your computer: 192.168.56.1                     │   │
│  │  • Access Tekton website here                      │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                         │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │  NAT Network (Internet Access)                     │   │
│  │  • VM routes to internet through your computer    │   │
│  │  • Downloads Node.js, npm packages, etc.          │   │
│  └────────────────┬────────────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
                   VirtualBox Internal
                          │
        ┌─────────────────▼──────────────────┐
        │   Windows Server VM                │
        │                                    │
        │  Host-Only IP: 192.168.56.10      │
        │  NAT IP: 10.0.2.15 (automatic)    │
        │                                    │
        │  Services:                         │
        │  ✅ AD DS (Domain Controller)      │
        │  ✅ DHCP (IP Assignment)           │
        │  ✅ DNS (Name Resolution)          │
        │  ✅ IIS (Web Server)               │
        │  ✅ Node.js (Runtime)              │
        │  ✅ Tekton Website                 │
        └────────────────────────────────────┘
```

---

## Table of Contents

1. [VirtualBox Network Configuration](#virtualbox-network-configuration)
2. [Windows Server Network Setup](#windows-server-network-setup)
3. [Verify AD DS, DHCP, DNS](#verify-ad-ds-dhcp-dns)
4. [Install Software](#install-software)
5. [Deploy Tekton Website](#deploy-tekton-website)
6. [Configure IIS](#configure-iis)
7. [Access from Host Computer](#access-from-host-computer)
8. [Troubleshooting](#troubleshooting)
9. [Command Reference](#command-reference)

---

## Step 1: VirtualBox Network Configuration

### 1.1 Add NAT Adapter to Windows Server VM

**On your LOCAL computer:**

1. **Open Oracle VirtualBox**
2. **Right-click Windows Server VM** → **Settings**
3. Go to **Network** tab
4. You should see:
   - **Adapter 1:** Host-Only (already configured)
   - **Adapter 2:** (empty)

5. **Click Adapter 2 tab:**
   - ✅ Check "Enable Network Adapter"
   - **Attached to:** NAT
   - **Name:** (leave default)
   - Click **OK**

6. **Restart the VM**

### 1.2 Verify Dual Network Setup

```
Adapter 1 (Host-Only): 192.168.56.X (local network)
Adapter 2 (NAT):       10.0.2.X     (internet access)
```

### 1.3 Verify Host-Only Configuration

**On your LOCAL computer:**

1. In VirtualBox → **Tools** → **Network**
2. Find **vboxnet0** (Host-Only adapter)
3. Verify settings:
   - ✅ IPv4 Address: `192.168.56.1`
   - ✅ IPv4 Network Mask: `255.255.255.0`
   - ✅ DHCP Server: **Enabled**
     - Server Address: `192.168.56.100`
     - Lower Address Bound: `192.168.56.101`
     - Upper Address Bound: `192.168.56.254`

4. If DHCP not enabled, click **Edit** → check DHCP settings

---

## Step 2: Windows Server Network Setup

### 2.1 Verify Both Adapters in Windows Server

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Get network adapters
Get-NetAdapter

# Should show:
# Name                      InterfaceDescription                    ifIndex Status
# ----                      --------------------                    ------- ------
# Ethernet                  VirtualBox Host-Only Ethernet Adapter          2 Up
# Ethernet 2                Intel(R) PRO/1000 MT Network Connection       3 Up

# Get IP addresses
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4"}

# Should show:
# IPAddress      PrefixLength
# ---------      -----------
# 192.168.56.X            24    (Host-Only)
# 10.0.2.X                24    (NAT)
```

### 2.2 Configure Static IP for Host-Only Adapter

**For predictable access, set a static IP:**

```powershell
# Get Host-Only adapter name
$adapter = Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*Host-Only*"}

# Remove any existing IP config
Remove-NetIPAddress -InterfaceAlias $adapter.Name -Confirm:$false

# Set static IP: 192.168.56.10
New-NetIPAddress -InterfaceAlias $adapter.Name `
  -IPAddress 192.168.56.10 `
  -PrefixLength 24 `
  -DefaultGateway 192.168.56.1

# Set DNS
Set-DnsClientServerAddress -InterfaceAlias $adapter.Name `
  -ServerAddresses "192.168.56.10"

# Verify
Get-NetIPAddress -InterfaceAlias $adapter.Name
```

### 2.3 Verify Internet Access (NAT Adapter)

```powershell
# Test internet connectivity
Test-NetConnection -ComputerName 8.8.8.8 -WarningAction SilentlyContinue

# Should show:
# TcpTestSucceeded : True

# Try DNS lookup
nslookup google.com

# Should resolve successfully
```

**If no internet:**
1. Check adapter 2 in VirtualBox settings
2. Ensure NAT is selected
3. Restart VM: `Restart-Computer`

---

## Step 3: Verify AD DS, DHCP, DNS

### 3.1 Check Domain Controller

```powershell
# Verify AD DS is running
Get-Service NTDS

# Should show: Status : Running

# Get domain info
Get-ADDomain

# Should show:
# DistinguishedName: DC=your,DC=local
# Name: your
# Forest: your.local
```

### 3.2 Verify DHCP Server

```powershell
# Check DHCP service
Get-Service DHCP

# Should show: Running

# List DHCP scopes
Get-DhcpServerv4Scope

# Should show active scope like:
# ScopeId         : 192.168.56.0
# Name            : VirtualBox Host-Only
# State           : Active
# StartRange      : 192.168.56.100
# EndRange        : 192.168.56.254
```

### 3.3 Verify DNS Server

```powershell
# Check DNS service
Get-Service DNS

# Should show: Running

# List DNS zones
Get-DnsServerZone

# Should include your domain, e.g.:
# Zone Name    : your.local
# ZoneType     : Primary
# IsDsIntegrated : True

# List DNS A records
Get-DnsServerResourceRecord -ZoneName "your.local"
```

### 3.4 Start Services if Needed

```powershell
# Start any stopped services
Start-Service NTDS   # AD DS
Start-Service DNS    # DNS
Start-Service DHCP   # DHCP
Start-Service W3SVC  # IIS

# Verify all running
Get-Service NTDS, DNS, DHCP, W3SVC
```

---

## Step 4: Install Software

### 4.1 Verify IIS is Installed

```powershell
# Check IIS
Get-Service W3SVC

# Should show: Running

# Open IIS Manager
inetmgr

# Should launch IIS Manager window
```

**If W3SVC not running:**

```powershell
Start-Service W3SVC
```

### 4.2 Install Node.js LTS

**On Windows Server VM:**

1. Open PowerShell **as Administrator**
2. Download Node.js:

```powershell
# Download Node.js LTS (v20 or latest)
$nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
$installer = "C:\Temp\node-installer.msi"

# Create Temp folder if needed
mkdir "C:\Temp" -ErrorAction SilentlyContinue

# Download
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $nodeUrl -OutFile $installer

# Install
Start-Process -FilePath $installer -ArgumentList "/qn" -Wait

# Cleanup
Remove-Item $installer
```

3. **Restart PowerShell** (close and reopen as Administrator)

4. **Verify:**

```powershell
node --version
npm --version

# Should show versions like:
# v20.10.0
# 10.2.0
```

### 4.3 Install Git

```powershell
# Download Git for Windows
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.1/Git-2.42.0-64-bit.exe"
$installer = "C:\Temp\git-installer.exe"

# Download
Invoke-WebRequest -Uri $gitUrl -OutFile $installer

# Install
Start-Process -FilePath $installer -ArgumentList "/SP- /VERYSILENT /SUPPRESSMSGBOXES" -Wait

# Cleanup
Remove-Item $installer

# Restart PowerShell
```

**Verify:**

```powershell
git --version

# Should show: git version 2.42.0.windows.1
```

### 4.4 Install iisnode

```powershell
# Install globally
npm install -g iisnode

# Verify
iisnode --version

# Check location
where iisnode
# Should show: C:\Users\...\AppData\Roaming\npm\node_modules\iisnode\bin\iisnode
```

### 4.5 Install Visual C++ Redistributable

**Download and run manually:**

1. Go to [Microsoft Visual C++ Downloads](https://support.microsoft.com/en-us/help/2977003)
2. Download **vc_redist.x64.exe** (Visual Studio 2015-2022 Redistributable 64-bit)
3. Save to `C:\Temp\`
4. Run:

```powershell
Start-Process -FilePath "C:\Temp\vc_redist.x64.exe" -ArgumentList "/quiet" -Wait
```

---

## Step 5: Deploy Tekton Website

### 5.1 Create Deployment Directory Structure

```powershell
# Create main directory
mkdir "C:\inetpub\tekton-website"

# Create subdirectories
mkdir "C:\inetpub\tekton-website\backend"
mkdir "C:\inetpub\tekton-website\frontend"
mkdir "C:\inetpub\tekton-website\logs"
mkdir "C:\inetpub\tekton-website\uploads"

# Verify
Get-ChildItem "C:\inetpub\tekton-website"
```

### 5.2 Set Folder Permissions

```powershell
# Grant NETWORK SERVICE full control (for IIS)
$path = "C:\inetpub\tekton-website"
$acl = Get-Acl $path

$permission = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "NETWORK SERVICE",
    "FullControl",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)

$acl.SetAccessRule($permission)
Set-Acl -Path $path -AclObject $acl

# Verify
Get-Acl $path | Format-List
```

### 5.3 Clone Project from GitHub

```powershell
cd C:\inetpub\tekton-website

# Clone repository
git clone https://github.com/kevinmorri921/TektonWebsite.git .

# Verify files
ls -la

# Should show: backend, src, package.json, etc.
```

### 5.4 Install Dependencies

```powershell
cd C:\inetpub\tekton-website

# Install backend dependencies
cd backend
npm install

# Back to root
cd ..

# Install frontend dependencies
npm install

# Build frontend for production
npm run build

# Verify dist folder
ls dist

# Should contain: index.html, assets/
```

### 5.5 Configure Environment Variables

**Create backend .env file:**

**File: `C:\inetpub\tekton-website\backend\.env`**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://tekton_user:YOUR_PASSWORD@cluster.mongodb.net/tekton?retryWrites=true&w=majority
JWT_SECRET=your_very_secret_key_minimum_32_characters_long_change_this
JWT_EXPIRY=7d
UPLOAD_DIR=C:\inetpub\tekton-website\backend\uploads
LOG_DIR=C:\inetpub\tekton-website\logs
DOMAIN=your.local
CORS_ORIGIN=http://tekton.your.local
```

**Replace MongoDB connection:**
- Get your MongoDB Atlas connection string
- Replace `YOUR_PASSWORD` with actual password

---

## Step 6: Configure IIS

### 6.1 Create Application Pool

**In Windows Server VM:**

1. Open **IIS Manager** (type `inetmgr` in search or PowerShell)
2. In left panel, expand server name
3. **Right-click "Application Pools"** → **Add Application Pool**

```
Name: TektonAppPool
.NET CLR Version: No Managed Code
Managed Pipeline Mode: Integrated
```

4. Click **OK**
5. **Right-click TektonAppPool** → **Advanced Settings:**
   - **Start Mode:** `AlwaysRunning`
   - **Idle Time-out:** `0`
6. **Right-click TektonAppPool** → **Start**

### 6.2 Create Backend Application

**In IIS Manager:**

1. **Right-click "Sites"** → **Add Website**

```
Site name: TektonAPI
Application pool: TektonAppPool
Physical path: C:\inetpub\tekton-website\backend
Host name: api.tekton.your.local
IP address: All Unassigned
Port: 5000
```

2. Click **OK**

### 6.3 Configure iisnode Handler for Backend

1. **Select "TektonAPI" site** in IIS Manager left panel
2. **Double-click "Handler Mappings"** (in center panel)
3. In right panel, click **"Add Module Mapping"**

```
Request path: *.js
Module: iisnode
Executable: C:\Program Files\iisnode\iisnode.exe
Name: iisnode
```

4. Click **OK** → **Yes** to add

### 6.4 Add web.config to Backend

**File: `C:\inetpub\tekton-website\backend\web.config`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
      <add name="StaticFile" path="*" verb="*" modules="StaticFile" 
           resourceType="Either" requireAccess="Read" />
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
    <security>
      <requestFiltering>
        <fileExtensions>
          <add fileExtension=".js" allowed="true" />
          <add fileExtension=".json" allowed="true" />
        </fileExtensions>
      </requestFiltering>
    </security>
    <iisnode 
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxConcurrentRequestsPerProcess="1024"
      enableXFF="false"
    />
  </system.webServer>
</configuration>
```

### 6.5 Create Frontend Website

**In IIS Manager:**

1. **Right-click "Sites"** → **Add Website**

```
Site name: TektonWeb
Application pool: TektonAppPool
Physical path: C:\inetpub\tekton-website\dist
Host name: tekton.your.local
IP address: All Unassigned
Port: 80
```

2. Click **OK**

### 6.6 Add web.config to Frontend

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
      <mimeType fileExtension=".woff" mimeType="font/woff" />
      <mimeType fileExtension=".woff2" mimeType="font/woff2" />
      <mimeType fileExtension=".ttf" mimeType="font/ttf" />
      <mimeType fileExtension=".eot" mimeType="application/vnd.ms-fontobject" />
      <mimeType fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>
  </system.webServer>
</configuration>
```

### 6.7 Verify IIS Configuration

```powershell
# Restart IIS
iisreset /restart

# Check web sites are running
Get-IISSite

# Should show both sites
```

---

## Step 7: Configure DNS and Firewall

### 7.1 Create DNS Records

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Add DNS record for frontend
Add-DnsServerResourceRecordA -ZoneName "your.local" `
  -Name "tekton" `
  -IPv4Address "192.168.56.10" `
  -TimeToLive 3600

# Add DNS record for backend
Add-DnsServerResourceRecordA -ZoneName "your.local" `
  -Name "api" `
  -IPv4Address "192.168.56.10" `
  -TimeToLive 3600

# Verify records
Get-DnsServerResourceRecord -ZoneName "your.local" -Name "tekton"
Get-DnsServerResourceRecord -ZoneName "your.local" -Name "api"
```

### 7.2 Configure Firewall

```powershell
# Allow HTTP traffic
New-NetFirewallRule -DisplayName "Allow HTTP" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 80 `
  -Action Allow

# Allow HTTPS traffic (for future)
New-NetFirewallRule -DisplayName "Allow HTTPS" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 443 `
  -Action Allow

# Allow Node.js port 5000
New-NetFirewallRule -DisplayName "Allow Node.js Port 5000" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 5000 `
  -Action Allow

# Verify
Get-NetFirewallRule -DisplayName "Allow*"
```

### 7.3 Update CORS Configuration

**File: `backend/middleware/securityConfig.js`**

```javascript
const cors = require('cors');

const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://localhost:5173",
  
  // Production (Host-Only network)
  "http://tekton.your.local",
  "http://api.tekton.your.local:5000",
  "http://192.168.56.10",
  "http://192.168.56.10:80",
  "http://192.168.56.10:5000",
  
  // Host computer (can access VM)
  "http://192.168.56.1"
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### 7.4 Rebuild Frontend

```powershell
cd C:\inetpub\tekton-website

npm run build

# Verify dist folder updated
ls dist
```

---

## Step 8: Access from Host Computer

### 8.1 Verify Network Connectivity

**On your LOCAL computer (Windows PowerShell):**

```powershell
# Ping the server
ping 192.168.56.10

# Should get replies like:
# Reply from 192.168.56.10: bytes=32 time=2ms TTL=128

# Test DNS resolution (after replication)
ping tekton.your.local

# Should resolve to 192.168.56.10
```

### 8.2 Add to Hosts File (Optional)

**If DNS not yet replicated, add manually:**

**On your LOCAL computer:**

1. Open Notepad **as Administrator**
2. File → Open: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines at the end:

```
192.168.56.10  tekton.your.local
192.168.56.10  api.tekton.your.local
```

4. File → Save → Close

### 8.3 Test Website Access

**On your LOCAL computer - Open browser:**

```
http://tekton.your.local
```

Or use IP directly:

```
http://192.168.56.10
```

**You should see:**
- Tekton Website login page
- No errors
- Responsive design working

### 8.4 Test Backend API

**On your LOCAL computer - Open PowerShell:**

```powershell
# Test API endpoint
curl http://api.tekton.your.local:5000/api/events -v

# Or with IP
curl http://192.168.56.10:5000/api/events -v

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/json
# [... data ...]
```

### 8.5 Test Frontend Functionality

**In browser at `http://tekton.your.local`:**

1. **Test Signup:**
   - Click "Sign Up"
   - Fill in form
   - Submit
   - Check browser console (F12) for API calls

2. **Test Login:**
   - Use created account
   - Should redirect to dashboard

3. **Test API Integration:**
   - Check Network tab in browser dev tools
   - All requests should go to `api.tekton.your.local:5000`
   - No CORS errors

---

## Step 9: Create Domain User for App Pool

### 9.1 Create AD User

**In Windows Server VM (PowerShell as Administrator):**

```powershell
# Create new user in AD
New-ADUser -Name "tekton-service" `
  -SamAccountName "tekton-service" `
  -UserPrincipalName "tekton-service@your.local" `
  -EmailAddress "tekton@your.local" `
  -AccountPassword (ConvertTo-SecureString -AsPlainText "TektonService@2024" -Force) `
  -PasswordNeverExpires $true `
  -Enabled $true

# Verify user created
Get-ADUser -Filter {SamAccountName -eq "tekton-service"}
```

### 9.2 Assign to Application Pool

**In IIS Manager:**

1. **Right-click "TektonAppPool"** → **Advanced Settings**
2. Find **"Process Model"** section
3. Click **Identity** row → click **...**
4. Select **"Custom account"** → **Set**
5. Enter credentials:
   - Username: `your.local\tekton-service`
   - Password: `TektonService@2024`
6. Click **OK** twice

---

## Step 10: Setup and Testing

### 10.1 Complete Checklist Before Testing

```powershell
# On Windows Server VM

# 1. Verify all services running
Get-Service W3SVC, NTDS, DNS, DHCP | Format-Table

# 2. Check IIS sites
Get-IISSite | Format-Table

# 3. Verify Node.js
node --version

# 4. Check git
git --version

# 5. Verify iisnode
iisnode --version

# 6. Check backend files
ls C:\inetpub\tekton-website\backend

# 7. Check frontend files
ls C:\inetpub\tekton-website\dist

# 8. Test backend locally
curl http://localhost:5000/api/events

# 9. Test frontend locally
curl http://localhost
```

### 10.2 Test from Host Computer

**On your LOCAL computer:**

```powershell
# 1. Ping server
ping 192.168.56.10

# 2. Test HTTP
Test-NetConnection -ComputerName 192.168.56.10 -Port 80

# 3. Test API
curl http://api.tekton.your.local:5000/api/events

# 4. Visit in browser
Start-Process "http://tekton.your.local"
```

### 10.3 Check IIS Logs for Errors

**On Windows Server:**

```powershell
# View IIS logs
$logPath = "C:\inetpub\logs\LogFiles\W3SVC1"
Get-ChildItem $logPath | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50

# View iisnode logs
$iisNodeLogs = "C:\inetpub\tekton-website\backend\iisnode"
ls $iisNodeLogs
```

### 10.4 Test Signup Flow

**In browser at `http://tekton.your.local`:**

1. Navigate to **Sign Up** page
2. Fill in form:
   - Name: Test User
   - Email: test@domain.com
   - Role: Select role
   - Password: SecurePass123!
3. Click **Submit**
4. **Expected:** Verification email sent, success message
5. Check browser console (F12) for any errors

### 10.5 Test Data Flow

**Verify data saves to MongoDB:**

```powershell
# From Windows Server, connect to MongoDB
# (if local MongoDB installed)

# Or from your local computer with MongoDB Compass
# Connect to: mongodb+srv://tekton_user:password@cluster.mongodb.net

# Check Tekton database has collections:
# - users
# - events
# - activityLogs
```

---

## Command Reference

### Essential Windows Server Commands

```powershell
# ===== NETWORK =====
ipconfig
Get-NetAdapter
Get-NetIPAddress
ping 8.8.8.8

# ===== SERVICES =====
Get-Service W3SVC
Start-Service W3SVC
Restart-Service W3SVC
Get-Service DHCP
Get-Service DNS
Get-Service NTDS

# ===== IIS =====
inetmgr                           # Open IIS Manager
iisreset /restart                 # Restart IIS
iisreset /stop                    # Stop IIS
iisreset /start                   # Start IIS
Get-IISSite                        # List websites
Start-IISAppPool -Name "TektonAppPool"
Stop-IISAppPool -Name "TektonAppPool"
Restart-IISAppPool -Name "TektonAppPool"

# ===== NODE.js =====
node --version
npm --version
npm list -g                       # List global packages
npm update -g                     # Update global packages

# ===== GIT =====
git --version
cd C:\inetpub\tekton-website
git pull origin main
git status
git log --oneline -10

# ===== BUILD =====
npm install
npm run build
npm run dev

# ===== DNS =====
Get-DnsServerZone
Get-DnsServerResourceRecord -ZoneName "your.local"
Add-DnsServerResourceRecordA -ZoneName "your.local" -Name "tekton" -IPv4Address "192.168.56.10"

# ===== DHCP =====
Get-DhcpServerv4Scope
Get-DhcpServerv4Lease -ScopeId "192.168.56.0"

# ===== FIREWALL =====
Get-NetFirewallRule -DisplayName "Allow*"
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

### Essential Local Computer (Host) Commands

```powershell
# Test connectivity
ping 192.168.56.10
ping tekton.your.local

# Test ports
Test-NetConnection -ComputerName 192.168.56.10 -Port 80
Test-NetConnection -ComputerName 192.168.56.10 -Port 5000

# Test API
curl http://api.tekton.your.local:5000/api/events -v

# Clear DNS cache
ipconfig /flushdns

# View network interfaces
ipconfig

# Edit hosts file (as Administrator)
notepad C:\Windows\System32\drivers\etc\hosts
```

---

## Troubleshooting

### Issue: Can't Connect to Website from Host Computer

**Solution:**

```powershell
# Step 1: Verify both adapters exist
# On host computer - open VirtualBox settings for VM

# Step 2: Ping the server
ping 192.168.56.10

# Step 3: Check DNS resolution
nslookup tekton.your.local

# Step 4: Test port connectivity
Test-NetConnection -ComputerName 192.168.56.10 -Port 80

# Step 5: Check IIS is running on server
Get-Service W3SVC

# Step 6: Try IP directly
Start-Process "http://192.168.56.10"

# Step 7: Check hosts file
notepad C:\Windows\System32\drivers\etc\hosts
```

### Issue: No Internet Connection on Windows Server

**Solution:**

```powershell
# Verify NAT adapter is enabled
Get-NetAdapter

# If missing, add in VirtualBox:
# Settings → Network → Adapter 2 → Enable → NAT

# Try to ping external address
ping 8.8.8.8

# Check routing
Get-NetRoute | grep -i 0.0.0.0

# If NAT adapter shows but no internet:
# Restart VM: Restart-Computer
```

### Issue: DNS Records Not Found

**Solution:**

```powershell
# On Windows Server
Get-DnsServerResourceRecord -ZoneName "your.local"

# If missing, create:
Add-DnsServerResourceRecordA -ZoneName "your.local" -Name "tekton" -IPv4Address "192.168.56.10"

# On host computer, clear cache:
ipconfig /flushdns

# Wait 30 seconds, then test:
nslookup tekton.your.local
```

### Issue: IIS Returns 500 Error

**Solution:**

```powershell
# Check iisnode logs
ls C:\inetpub\tekton-website\backend\iisnode

# View recent logs
Get-Content C:\inetpub\logs\LogFiles\W3SVC1\*.log -Tail 100

# Check Node.js process running
Get-Process node

# Check .env file exists and is valid
cat C:\inetpub\tekton-website\backend\.env

# Restart IIS
iisreset /restart
```

### Issue: CORS Errors in Browser

**Solution:**

```javascript
// File: backend/middleware/securityConfig.js
// Make sure your URL is in allowedOrigins:

const allowedOrigins = [
  "http://tekton.your.local",      // Must match exactly
  "http://192.168.56.10",           // Add IP too
  "http://192.168.56.10:80",        // Include port
];

// Then test:
curl -H "Origin: http://tekton.your.local" http://api.tekton.your.local:5000/api/events
```

### Issue: Firewall Blocking Ports

**Solution:**

```powershell
# Check if firewall is on
Get-NetFirewallProfile

# Disable firewall temporarily for testing (NOT PRODUCTION)
Set-NetFirewallProfile -Profile Public -Enabled $false

# Or add specific rules
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow

# Test
curl http://192.168.56.10:5000/api/events
```

### Issue: Node.js Process Crashes

**Solution:**

```powershell
# View backend logs
cat C:\inetpub\tekton-website\backend\.env

# Check for errors in iisnode logs
ls C:\inetpub\tekton-website\backend\iisnode | Sort-Object LastWriteTime -Descending | Get-Content

# Manually start Node.js to see errors
cd C:\inetpub\tekton-website\backend
node server.js

# Should show startup messages or errors
```

---

## Production Deployment Checklist

- [ ] Both network adapters configured (Host-Only + NAT)
- [ ] Static IP set on Host-Only adapter (192.168.56.10)
- [ ] AD DS operational with domain
- [ ] DHCP server running and assigning IPs
- [ ] DNS server running with zones and records
- [ ] IIS installed and W3SVC running
- [ ] Node.js v20 LTS installed
- [ ] Git installed and repository cloned
- [ ] iisnode installed globally
- [ ] Application pool created (TektonAppPool)
- [ ] Backend website created (port 5000)
- [ ] Frontend website created (port 80)
- [ ] web.config files in place (backend + frontend)
- [ ] iisnode handler registered for *.js
- [ ] DNS A records created (tekton + api)
- [ ] Firewall rules added (ports 80, 5000)
- [ ] CORS configuration updated
- [ ] Frontend built successfully (dist/ folder)
- [ ] Backend dependencies installed
- [ ] .env file configured with MongoDB URI
- [ ] Can access from host computer
- [ ] Signup/login working end-to-end
- [ ] API calls successful from frontend
- [ ] No CORS errors in browser console
- [ ] IIS logs show no errors
- [ ] Backups of VM configured

---

## Next Steps

1. **Implement Network Setup** - Add NAT adapter and verify both network interfaces
2. **Deploy Application** - Clone project and install dependencies
3. **Configure IIS** - Create sites, app pools, and web.config files
4. **Test End-to-End** - Verify signup, login, and API integration
5. **Monitor and Debug** - Check logs and performance metrics
6. **Setup Backups** - Regularly backup Windows Server VM
7. **Document Configuration** - Keep DNS records, credentials, and settings documented

---

## Support

- **AD DS Help:** [Microsoft AD DS Documentation](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/ad-ds-deployment-guide)
- **IIS Help:** [Microsoft IIS Documentation](https://docs.microsoft.com/en-us/iis/)
- **Node.js Help:** [Node.js Official Docs](https://nodejs.org/docs/)
- **MongoDB Help:** [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

**Your enterprise-grade deployment is ready! 🚀**
