# Windows Server - Pre-Deployment Installation Checklist

## Overview
This guide lists EVERYTHING you need to install on your Windows Server **BEFORE** deploying the Tekton Website system.

---

## 📋 Complete Installation Checklist

### ✅ Step 1: Operating System Requirements

**Required:**
- [ ] Windows Server 2016 or later
  - Windows Server 2019 (Recommended)
  - Windows Server 2022 (Latest)

**Check your version:**
```powershell
# Run in PowerShell as Administrator
[System.Environment]::OSVersion.VersionString

# Example output: Microsoft Windows NT 10.0.19045.0
```

**If you need to upgrade:**
- Download from Microsoft Volume Licensing Service Center (VLSC)
- Or purchase from Microsoft directly

---

### ✅ Step 2: IIS (Internet Information Services)

**What it is:** Web server to host your application

**Installation method: PowerShell (EASIEST)**

```powershell
# Run PowerShell as Administrator

# Enable IIS Web Server Role
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole

# Enable Web Server component
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer

# Enable WebSocket support (needed for real-time features)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets

# Enable Application Development features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment

# Enable CGI (for running scripts)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CGI

# Enable URL Rewrite (for routing)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLRewrite

# Verify installation
Get-Service W3SVC

# Start IIS if not running
Start-Service W3SVC
```

**Alternative method: Server Manager GUI**
1. Open **Server Manager** (Start Menu)
2. Click **Add Roles and Features**
3. Select **Web Server (IIS)** role
4. Include all features listed above
5. Click **Install**

**Verify installation:**
- Open browser
- Visit `http://localhost`
- Should see IIS default page

---

### ✅ Step 3: Node.js (LTS Version)

**What it is:** Runtime for your Express backend

**Download & Install:**

1. Go to [nodejs.org](https://nodejs.org)
2. Click **LTS** (Long Term Support)
   - Currently: v20.10.0 LTS
   - Download **Windows Installer (.msi)**
3. Run installer as Administrator
4. Accept all defaults
5. **Important:** Allow installation of npm dependencies
6. Restart your server (optional but recommended)

**Verify installation:**

```powershell
# Check Node.js version
node --version
# Example output: v20.10.0

# Check npm version
npm --version
# Example output: 10.2.0
```

**Important:** 
- Node.js must be in your system PATH
- npm comes bundled with Node.js
- Both should be in `C:\Program Files\nodejs\`

---

### ✅ Step 4: Git

**What it is:** Version control to clone your project

**Download & Install:**

1. Go to [git-scm.com](https://git-scm.com)
2. Download **Git for Windows (64-bit)**
3. Run installer as Administrator
4. During installation:
   - Use default settings
   - Select "Use Git from Command Line"
   - Accept all other defaults
5. Click **Install**

**Verify installation:**

```powershell
git --version
# Example output: git version 2.41.0.windows.3

git config --list
```

---

### ✅ Step 5: IIS Node Module

**What it is:** Allows IIS to run Node.js applications

**Installation:**

```powershell
# Run PowerShell as Administrator

# Install iisnode globally
npm install -g iisnode

# Verify installation
iisnode --version
# Example output: 0.2.26

# Check installation location
where iisnode
# Example output: C:\Users\...\AppData\Roaming\npm\iisnode
```

---

### ✅ Step 6: IIS URL Rewrite Module

**What it is:** Rewrites URLs for routing (already enabled above, but verify)

**Standalone installation (if needed):**

1. Download from [Microsoft IIS URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Run installer as Administrator
3. Accept all defaults
4. Restart IIS:

```powershell
iisreset /restart
```

---

### ✅ Step 7: MongoDB Connection

**Choose ONE option:**

#### Option A: MongoDB Atlas (Cloud - RECOMMENDED)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create free M0 cluster
4. Create database user (username/password)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/tekton`
6. **No installation needed on server**

**Verify connection:**

```powershell
# Using MongoDB Shell (optional)
npm install -g mongodb-shell

# Test connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tekton"
```

#### Option B: Local MongoDB (On your server)

1. Download from [mongodb.com/try/download](https://www.mongodb.com/try/download/community)
2. Choose **Windows Server** version
3. Download **MSI Installer**
4. Run installer as Administrator
5. Accept license
6. Select **Install MongoDB as a Service** option
7. Complete installation

**Verify installation:**

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start MongoDB if not running
Start-Service MongoDB

# Connect to MongoDB
mongosh
# Should show MongoDB shell prompt
```

**Which should I choose?**
- **MongoDB Atlas (Cloud):** ✅ Easiest, automatic backups, no server maintenance
- **Local MongoDB:** ⚠️ Requires server maintenance, backups, disk space

---

### ✅ Step 8: Visual C++ Redistributable (REQUIRED)

**What it is:** Libraries needed for Node.js and some modules

**Download & Install:**

1. Go to [Microsoft Visual C++ Downloads](https://support.microsoft.com/en-us/help/2977003)
2. Download **Visual C++ Redistributable** (Latest version, 64-bit)
3. Run installer as Administrator
4. Accept all defaults

**Current version:**
- Download: `vc_redist.x64.exe`

**Verify installation:**

```powershell
# Visual C++ should be in Programs and Features
Get-WmiObject -Class Win32_Product | Where-Object {$_.Name -like "*Visual*C*"}
```

---

### ✅ Step 9: .NET Framework (OPTIONAL but RECOMMENDED)

**What it is:** May be needed for some IIS features

**Installation:**

```powershell
# Run PowerShell as Administrator

# Enable .NET Framework 4.8
Enable-WindowsOptionalFeature -Online -FeatureName NetFx4Extended-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
```

---

### ✅ Step 10: Windows Firewall Rules

**What it is:** Allow traffic to your website

**Add firewall rules:**

```powershell
# Run PowerShell as Administrator

# Allow HTTP (Port 80)
netsh advfirewall firewall add rule `
  name="Allow HTTP" `
  dir=in `
  action=allow `
  protocol=tcp `
  localport=80

# Allow HTTPS (Port 443)
netsh advfirewall firewall add rule `
  name="Allow HTTPS" `
  dir=in `
  action=allow `
  protocol=tcp `
  localport=443

# Allow Node.js Backend (Port 5000)
netsh advfirewall firewall add rule `
  name="Allow Node.js" `
  dir=in `
  action=allow `
  protocol=tcp `
  localport=5000

# Verify rules were added
netsh advfirewall firewall show rule name=all
```

---

### ✅ Step 11: Create Deployment Directories

**Create folder structure:**

```powershell
# Run PowerShell as Administrator

# Create main deployment directory
mkdir "C:\inetpub\tekton-website"
mkdir "C:\inetpub\tekton-website\backend"
mkdir "C:\inetpub\tekton-website\frontend"
mkdir "C:\inetpub\tekton-website\logs"
mkdir "C:\inetpub\tekton-website\uploads"

# Verify directories
Get-ChildItem "C:\inetpub\tekton-website"
```

**Set proper permissions:**

```powershell
# Give NETWORK SERVICE full control
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

# Verify permissions
Get-Acl $path | Format-List
```

---

### ✅ Step 12: Optional - Helpful Tools

#### 12A: Notepad++ (Text Editor)
- Download: [notepad-plus-plus.org](https://notepad-plus-plus.org)
- Use for editing configuration files

#### 12B: 7-Zip (File Compression)
- Download: [7-zip.org](https://www.7-zip.org)
- Use for backing up your system

#### 12C: Postman (API Testing)
- Download: [postman.com](https://www.postman.com)
- Test your API before deploying

#### 12D: MongoDB Compass (Database GUI)
- Download: [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Visual database management tool

---

## 🔍 Installation Verification Checklist

After installing everything, run these commands to verify:

```powershell
# 1. Check Windows version
[System.Environment]::OSVersion.VersionString

# 2. Check IIS is running
Get-Service W3SVC

# 3. Check Node.js
node --version
npm --version

# 4. Check Git
git --version

# 5. Check iisnode
iisnode --version

# 6. Check Visual C++
Get-WmiObject -Class Win32_Product | Where-Object {$_.Name -like "*Visual*C*"}

# 7. Check firewall rules
netsh advfirewall firewall show rule name=all | findstr "tekton\|HTTP\|HTTPS\|Node"

# 8. Check deployment directories
Get-ChildItem "C:\inetpub\tekton-website" -Recurse

# 9. Test IIS locally
curl http://localhost
# Should show IIS default page

# 10. Test Node.js
node -e "console.log('Node.js is working')"
# Should output: Node.js is working
```

---

## 📊 Installation Order (IMPORTANT)

Follow this exact order for best results:

```
1. Windows Server OS (already have this)
   ↓
2. IIS (Web Server Role)
   ↓
3. Node.js (LTS version)
   ↓
4. Git (for cloning project)
   ↓
5. iisnode (Node integration)
   ↓
6. URL Rewrite Module
   ↓
7. MongoDB (Atlas or Local)
   ↓
8. Visual C++ Redistributable
   ↓
9. .NET Framework (optional)
   ↓
10. Windows Firewall Rules
    ↓
11. Create Directories & Permissions
    ↓
12. Optional Tools
```

---

## 💾 System Requirements Summary

| Component | Requirement | Minimum | Recommended |
|-----------|------------|---------|------------|
| **OS** | Windows Server | 2016 | 2019/2022 |
| **RAM** | Memory | 2 GB | 8 GB |
| **Storage** | Disk Space | 50 GB | 100+ GB |
| **CPU** | Processor | 2 cores | 4+ cores |
| **Node.js** | Version | v14 LTS | v20 LTS |
| **Database** | MongoDB | M0 (free) | M2+ (paid) |

---

## 🔑 Important Notes

### Critical:
- ⚠️ **Run ALL PowerShell commands as Administrator**
- ⚠️ **Restart server after major installations**
- ⚠️ **MongoDB Atlas is EASIEST option** (no local installation needed)
- ⚠️ **Keep Node.js version CONSISTENT** on server and locally

### Security:
- 🔒 Only open firewall ports for what you need
- 🔒 Use strong passwords for MongoDB
- 🔒 Enable Windows Defender on server
- 🔒 Keep Windows updates current

### Troubleshooting:
- 📝 Save all installation logs
- 📝 Document your IP address
- 📝 Note any error messages
- 📝 Keep backup of configuration files

---

## 🚀 Next Steps

After completing all installations:

1. ✅ Verify all components above
2. ✅ Clone your TektonWebsite project to server
3. ✅ Install npm dependencies
   ```powershell
   cd C:\inetpub\tekton-website\backend
   npm install
   ```
4. ✅ Build frontend
   ```powershell
   cd C:\inetpub\tekton-website
   npm run build
   ```
5. ✅ Configure IIS sites (see IIS deployment guide)
6. ✅ Test everything

---

## 📞 Common Installation Issues

### Issue: PowerShell says "cannot be loaded"
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Node.js not recognized after install
**Solution:**
- Restart PowerShell or server
- Check `C:\Program Files\nodejs` folder exists
- Add to PATH manually if needed

### Issue: Port 80/443 already in use
**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :80

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Cannot access IIS
**Solution:**
```powershell
# Restart IIS
iisreset /restart

# Check service is running
Get-Service W3SVC
```

---

## 📋 Pre-Deployment Checklist

Before deploying your system, verify:

- [ ] Windows Server OS installed and updated
- [ ] IIS installed and running
- [ ] Node.js v16+ LTS installed
- [ ] Git installed and working
- [ ] iisnode module installed
- [ ] URL Rewrite module enabled
- [ ] MongoDB account created (Atlas)
- [ ] Visual C++ Redistributable installed
- [ ] .NET Framework 4.8 enabled
- [ ] Firewall rules added (ports 80, 443, 5000)
- [ ] Deployment directories created (`C:\inetpub\tekton-website`)
- [ ] Directory permissions set (NETWORK SERVICE)
- [ ] All commands verified in verification checklist
- [ ] Ready for project deployment

---

## 📞 Support

If you get stuck on any installation:

1. **Check Microsoft Documentation:** [microsoft.com/IIS](https://www.iis.net/)
2. **Node.js Help:** [nodejs.org/docs](https://nodejs.org/docs/)
3. **MongoDB Help:** [mongodb.com/docs](https://docs.mongodb.com/)
4. **Git Help:** [git-scm.com/doc](https://git-scm.com/doc)

---

**Once you complete ALL items above, you're ready to follow the IIS Deployment Guide!**
