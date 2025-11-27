# Windows Server on Oracle VirtualBox - Web Server Setup Guide

## Overview
You have:
- **Your Local Computer** (Host Machine)
- **Windows Server in VirtualBox** (Guest Machine - Virtual Server)
- **Network Connection** established between them

This guide explains how to set up IIS web server on your VirtualBox Windows Server so your local computer can access it.

---

## Table of Contents
1. [VirtualBox Network Configuration](#virtualbox-network-configuration)
2. [Windows Server Network Setup](#windows-server-network-setup)
3. [Install Required Software](#install-required-software)
4. [Deploy Tekton Website](#deploy-tekton-website)
5. [Access from Your Local Computer](#access-from-your-local-computer)
6. [Troubleshooting](#troubleshooting)

---

## Step 1: VirtualBox Network Configuration

### 1.1 Check Current Network Mode

**On your HOST machine (your computer):**

1. Open **Oracle VirtualBox**
2. Right-click your Windows Server VM → **Settings**
3. Go to **Network** tab
4. Check current adapter setting

### 1.2 Recommended Network Setup

**Option A: Bridged Adapter (RECOMMENDED - Easiest)**

This makes the VM look like a separate computer on your network.

1. VM Settings → **Network** tab
2. **Attached to:** Select `Bridged Adapter`
3. **Name:** Select your network adapter (e.g., WiFi or Ethernet)
4. Click **OK**
5. **Start the VM**

**Benefits:**
- VM gets its own IP address from your router
- Easy to access from host and other devices
- Behaves like a real computer on network

**Option B: Host-Only Adapter (Alternative)**

This creates a private network between host and VM only.

1. VM Settings → **Network** tab
2. **Attached to:** Select `Host-only Adapter`
3. Click **OK**

**Benefits:**
- Isolated network (more secure)
- Good for development/testing
- Only your computer can access VM

**Option C: NAT (Not Recommended)**

1. VM Settings → **Network** tab
2. **Attached to:** Select `NAT`
3. Click **OK**

⚠️ **Problem:** Harder to access from host machine (requires port forwarding)

---

### 1.3 Find Your VM's IP Address

**Inside your VirtualBox Windows Server:**

```powershell
# Open PowerShell and run:
ipconfig

# Look for IPv4 Address
# Example output:
# IPv4 Address: 192.168.1.100
```

**Write down this IP address - you'll need it!**

---

## Step 2: Windows Server Network Setup

### 2.1 Ensure Network Connection Works

**In Windows Server (VM):**

```powershell
# Test internet connection
ping google.com

# Should see replies like:
# Reply from 142.250.80.46: bytes=32 time=45ms TTL=119

# Test connectivity to host machine
ping YOUR_HOST_IP

# Your host IP might be something like 192.168.1.50
```

### 2.2 Disable Firewall (For Testing - Enable Later)

⚠️ **Only for testing/development. Enable firewall in production!**

```powershell
# Run PowerShell as Administrator

# Disable Windows Defender Firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled $false

# Or disable only for private network (safer)
Set-NetFirewallProfile -Profile Private -Enabled $false
```

**Later, add specific rules instead:**

```powershell
# Enable firewall back on
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled $true

# Allow specific ports
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=tcp localport=80
netsh advfirewall firewall add rule name="Allow HTTPS" dir=in action=allow protocol=tcp localport=443
netsh advfirewall firewall add rule name="Allow Node.js" dir=in action=allow protocol=tcp localport=5000
```

---

## Step 3: Install Required Software on VM

### 3.1 Enable IIS

**In Windows Server (VM), run PowerShell as Administrator:**

```powershell
# Enable IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CGI
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLRewrite

# Verify IIS is running
Get-Service W3SVC

# Start if not running
Start-Service W3SVC
```

**Verify in browser (on VM):**
```
http://localhost
```
Should show IIS default page.

### 3.2 Install Node.js LTS

**On your Windows Server VM:**

1. Download Node.js from [nodejs.org](https://nodejs.org)
   - Click **LTS** (v20.10.0 or latest)
   - Download **Windows Installer (.msi) 64-bit**
2. Run installer as Administrator
3. Accept defaults
4. Restart VM

**Verify:**

```powershell
node --version
npm --version
```

### 3.3 Install Git

**On your Windows Server VM:**

1. Download Git from [git-scm.com](https://git-scm.com)
2. Download **Git for Windows (64-bit)**
3. Run installer as Administrator
4. Accept defaults
5. Restart PowerShell

**Verify:**

```powershell
git --version
```

### 3.4 Install iisnode

**On your Windows Server VM:**

```powershell
# Install iisnode globally
npm install -g iisnode

# Verify
iisnode --version
```

### 3.5 Install Visual C++ Redistributable

**On your Windows Server VM:**

1. Download from [Microsoft Visual C++](https://support.microsoft.com/en-us/help/2977003)
2. Download **vc_redist.x64.exe** (64-bit)
3. Run as Administrator
4. Accept defaults

---

## Step 4: Share Folder from Host to VM

This makes it easier to transfer your project files.

### 4.1 On Your HOST Machine

1. Open **Oracle VirtualBox**
2. Right-click Windows Server VM → **Settings**
3. Go to **Shared Folders** tab
4. Click **Add new shared folder** (green plus button)
5. **Folder Path:** Choose your project location
   - Example: `C:\Users\YourName\Documents\TektonWebsite`
6. **Folder Name:** Type `tekton-share`
7. Check ✅ **Auto-mount**
8. Check ✅ **Make Permanent**
9. Click **OK**

### 4.2 In Windows Server VM

**The shared folder appears as network drive:**

```powershell
# Check shared folders
net use

# Should show: \\vboxsvr\tekton-share mapped to some drive letter
```

**Access the shared folder:**

```powershell
# Navigate to it (usually Z: drive on Windows)
Z:
ls

# Or use exact path
\\vboxsvr\tekton-share
```

---

## Step 5: Copy Project to VM

### 5.1 Option A: Using Shared Folder

```powershell
# Inside Windows Server VM
# Copy from shared folder to IIS directory

Copy-Item "\\vboxsvr\tekton-share\*" -Destination "C:\inetpub\tekton-website\" -Recurse -Force
```

### 5.2 Option B: Using Git (RECOMMENDED)

```powershell
# Inside Windows Server VM
cd C:\inetpub

# Clone your repository
git clone https://github.com/kevinmorri921/TektonWebsite.git tekton-website

# Navigate to project
cd C:\inetpub\tekton-website
```

---

## Step 6: Install Dependencies

**In Windows Server VM:**

```powershell
cd C:\inetpub\tekton-website

# Install backend dependencies
cd backend
npm install

# Build frontend
cd ..
npm install
npm run build

# Should create dist folder
ls dist
```

---

## Step 7: Configure IIS

### 7.1 Create Application Pool

**In Windows Server VM:**

1. Open **IIS Manager** (type `inetmgr.exe` in search)
2. Right-click **Application Pools** → **Add Application Pool**
   - Name: `TektonAppPool`
   - .NET version: `No Managed Code`
   - Mode: `Integrated`
3. Right-click the pool → **Advanced Settings:**
   - Start Mode: `AlwaysRunning`
   - Idle Time-out: `0`
4. Right-click pool → **Start**

### 7.2 Create Backend Website

1. In IIS Manager, right-click **Sites** → **Add Website**
   - Site name: `TektonAPI`
   - Application pool: `TektonAppPool`
   - Physical path: `C:\inetpub\tekton-website\backend`
   - Host name: `api.local`
   - Port: `5000`
2. Click **OK**

### 7.3 Configure Backend web.config

**Create file: `C:\inetpub\tekton-website\backend\web.config`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
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
  </system.webServer>
</configuration>
```

### 7.4 Create Frontend Website

1. Right-click **Sites** → **Add Website**
   - Site name: `TektonWeb`
   - Application pool: `TektonAppPool`
   - Physical path: `C:\inetpub\tekton-website\dist`
   - Host name: `tekton.local`
   - Port: `80`
2. Click **OK**

### 7.5 Configure Frontend web.config

**Create file: `C:\inetpub\tekton-website\dist\web.config`**

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

## Step 8: Access from Your Local Computer

### 8.1 Find VM's IP Address

**In Windows Server VM:**

```powershell
ipconfig

# Look for: IPv4 Address
# Example: 192.168.1.100
```

### 8.2 Edit Your Local Computer's HOSTS File

**On YOUR LOCAL COMPUTER (not the VM):**

**Windows:**
- Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
- Add these lines:
```
192.168.1.100   tekton.local
192.168.1.100   api.local
```

**Mac/Linux:**
- Open `/etc/hosts` with sudo
- Add same lines

### 8.3 Access from Browser

**On your LOCAL COMPUTER:**

```
Frontend:  http://tekton.local
Backend:   http://api.local:5000
```

**If using IP address directly:**

```
Frontend:  http://192.168.1.100
Backend:   http://192.168.1.100:5000
```

---

## Step 9: Update API URL in Frontend

**In Windows Server VM:**

```powershell
# Edit environment variables
# File: C:\inetpub\tekton-website\.env.production
```

Change from:
```env
VITE_API_URL=http://localhost:5000
```

To:
```env
VITE_API_URL=http://api.local:5000
# Or use IP:
# VITE_API_URL=http://192.168.1.100:5000
```

**Rebuild:**

```powershell
cd C:\inetpub\tekton-website
npm run build
```

---

## Step 10: Testing

### 10.1 Test from VM (Local)

**Inside Windows Server VM:**

```powershell
# Test backend
curl http://localhost:5000/api/events

# Test frontend (open browser)
http://localhost
```

### 10.2 Test from Your Computer (Host)

**On your local computer - Open browser:**

```
http://tekton.local
```

Should see Tekton login page!

### 10.3 Test Signup

1. Go to signup page: `http://tekton.local/signup`
2. Fill in form with test data
3. Click Sign Up
4. Should see success message
5. Redirect to login

---

## Step 11: Configure MongoDB

### Option A: MongoDB Atlas (RECOMMENDED - Cloud)

```powershell
# No installation needed in VM
# Just add connection string to .env

# File: C:\inetpub\tekton-website\backend\.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tekton
```

### Option B: Local MongoDB on VM

```powershell
# Download from mongodb.com
# Run installer on Windows Server VM
# Follow standard MongoDB installation

# Test connection
mongosh "mongodb://localhost:27017/tekton"
```

---

## Step 12: Manage IIS from Host Computer

**You can manage IIS on your VM from your local computer!**

### 12.1 Enable IIS Remote Management on VM

**In Windows Server VM (PowerShell as Admin):**

```powershell
# Install Remote Management
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementService

# Start service
Start-Service WMSVC

# Allow through firewall
netsh advfirewall firewall add rule name="Allow IIS Remote" dir=in action=allow protocol=tcp localport=8172
```

### 12.2 Connect from Your Computer

1. Install **IIS Manager Console** on your local computer:
   - Download from [microsoft.com/web](https://www.microsoft.com/web)
2. Open IIS Manager
3. Right-click **Connections** → **Connect to a Server**
4. Enter: `192.168.1.100:8172` (VM's IP)

---

## Quick Reference Commands

**Essential PowerShell commands (run as Administrator):**

```powershell
# Check VM IP
ipconfig

# Restart IIS
iisreset /restart

# Start/Stop Application Pool
Start-IISAppPool -Name "TektonAppPool"
Stop-IISAppPool -Name "TektonAppPool"
Restart-IISAppPool -Name "TektonAppPool"

# Check services
Get-Service W3SVC
Get-Service WMSVC

# Pull latest code
cd C:\inetpub\tekton-website
git pull origin main

# Rebuild frontend
npm run build

# Restart IIS
iisreset /restart
```

---

## Troubleshooting VirtualBox Setup

### Issue: Can't ping VM from Host

**Solution:**
```powershell
# Make sure Bridged Adapter is selected
# In VirtualBox Settings → Network → Attached to: Bridged Adapter

# In Windows Server VM:
ipconfig
# Verify it has an IP from your router (e.g., 192.168.x.x)

# From host computer:
ping 192.168.1.100
```

### Issue: Shared Folder Not Appearing

**Solution:**
```powershell
# In Windows Server VM, install Guest Additions:
# Devices → Insert Guest Additions CD Image
# Follow installation wizard
# Restart VM

# Then check:
net use
```

### Issue: Can't Access Website from Host

**Solution:**
1. Check firewall is disabled (or ports are open)
2. Verify IIS is running: `Get-Service W3SVC`
3. Check VM's IP: `ipconfig`
4. Test from VM first: `curl http://localhost`
5. Check HOSTS file on YOUR computer (not VM)

### Issue: Port 80 Already in Use

**Solution:**
```powershell
# Find what's using port 80
netstat -ano | findstr :80

# Kill the process
taskkill /PID <PID> /F

# Or change IIS port to 8080 instead
```

---

## Network Diagram

```
┌─────────────────────────────┐
│   Your Local Computer       │
│  (Host Machine)             │
│                             │
│  Browser                    │
│  192.168.1.50               │
│                             │
│  Access:                    │
│  http://tekton.local        │
│  http://192.168.1.100       │
└──────────────┬──────────────┘
               │
        Network Connection
        (Your WiFi/Ethernet)
               │
┌──────────────▼──────────────┐
│   Windows Server on VM      │
│   (VirtualBox Guest)        │
│                             │
│  IIS Web Server             │
│  IP: 192.168.1.100          │
│                             │
│  Frontend: http://localhost │
│  Backend: http://localhost:5000
│                             │
│  MongoDB (Atlas or Local)   │
└─────────────────────────────┘
```

---

## 🎯 Summary

| Step | Location | What to Do |
|------|----------|-----------|
| 1 | VirtualBox Host | Set Network to Bridged Adapter |
| 2 | Windows Server VM | Note down IP address (e.g., 192.168.1.100) |
| 3 | Windows Server VM | Enable IIS, install Node.js, Git, iisnode |
| 4 | Windows Server VM | Copy/clone Tekton project |
| 5 | Windows Server VM | npm install, npm run build |
| 6 | Windows Server VM | Configure IIS sites with web.config |
| 7 | Your Local Computer | Add to HOSTS file |
| 8 | Your Local Computer | Access http://tekton.local |

---

## ✅ Production Checklist

- [ ] Network set to Bridged Adapter
- [ ] VM has static IP address (recommended)
- [ ] IIS installed and running
- [ ] Node.js, Git, iisnode installed
- [ ] Project copied to `C:\inetpub\tekton-website`
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] IIS sites configured
- [ ] web.config files created
- [ ] MongoDB connected
- [ ] HOSTS file updated on local computer
- [ ] Can access from local computer
- [ ] Signup/Login working
- [ ] API responding to requests

**You're ready to deploy! 🚀**
