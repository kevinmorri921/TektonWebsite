# ============================================
# TektonWebsite - Diagnostics & URL Helper
# ============================================
# This script helps you quickly configure ngrok URLs

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     TektonWebsite - ngrok Configuration Helper     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green

# ============================================
# STEP 1: Check ngrok Status
# ============================================

Write-Host "`n[STEP 1] 🔍 Checking ngrok status..." -ForegroundColor Cyan

# Test if ngrok is accessible
$ngrokTest = ngrok --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ngrok is installed: $ngrokTest" -ForegroundColor Green
} else {
    Write-Host "❌ ngrok not found" -ForegroundColor Red
    Write-Host "   Install: scoop install ngrok" -ForegroundColor Yellow
    exit 1
}

# Check authentication
$authTest = ngrok config check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ngrok is authenticated" -ForegroundColor Green
} else {
    Write-Host "❌ ngrok is NOT authenticated" -ForegroundColor Red
    Write-Host "   Get token: https://dashboard.ngrok.com/auth/your-authtoken" -ForegroundColor Yellow
    Write-Host "   Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
    exit 1
}

# ============================================
# STEP 2: Check Local Services
# ============================================

Write-Host "`n[STEP 2] 🔌 Checking local services..." -ForegroundColor Cyan

# Check Backend
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend running on localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not responding on localhost:5000" -ForegroundColor Yellow
    Write-Host "   Start: cd backend && npm start" -ForegroundColor Yellow
}

# Check Frontend
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend running on localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend not responding on localhost:5173" -ForegroundColor Yellow
    Write-Host "   Start: npm run dev" -ForegroundColor Yellow
}

# ============================================
# STEP 3: Configuration Helper
# ============================================

Write-Host "`n[STEP 3] ⚙️  Configuration Setup..." -ForegroundColor Cyan

$setup = Read-Host "`n📝 Do you want to add ngrok URLs to .env files? (y/n)"

if ($setup -eq "y" -or $setup -eq "yes") {
    Write-Host "`n📌 INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "   1. Open a PowerShell window" -ForegroundColor White
    Write-Host "   2. Run: ngrok http 5000 --region us" -ForegroundColor Cyan
    Write-Host "   3. Copy the URL (looks like: https://abc123.ngrok.io)" -ForegroundColor White
    Write-Host "   4. Paste it below" -ForegroundColor White
    
    $backendUrl = Read-Host "`n🔗 Enter Backend ngrok URL (https://...ngrok.io)"
    
    Write-Host "`n📌 NEXT:" -ForegroundColor Yellow
    Write-Host "   1. Open another PowerShell window" -ForegroundColor White
    Write-Host "   2. Run: ngrok http 5173 --region us" -ForegroundColor Cyan
    Write-Host "   3. Copy the URL and paste below" -ForegroundColor White
    
    $frontendUrl = Read-Host "`n🔗 Enter Frontend ngrok URL (https://...ngrok.io)"
    
    # ============================================
    # STEP 4: Update .env Files
    # ============================================
    
    Write-Host "`n[STEP 4] 📝 Updating configuration files..." -ForegroundColor Cyan
    
    # Update backend .env
    Write-Host "`n📄 Updating backend/.env..." -ForegroundColor White
    $backendEnvPath = ".\backend\.env"
    
    if (Test-Path $backendEnvPath) {
        $content = Get-Content $backendEnvPath -Raw
        # Add frontend URL to ALLOWED_ORIGINS
        if ($content -match "ALLOWED_ORIGINS=") {
            $content = $content -replace "ALLOWED_ORIGINS=([^\n]*)", "ALLOWED_ORIGINS=`$1,$frontendUrl"
        } else {
            $content += "`nALLOWED_ORIGINS=$frontendUrl"
        }
        Set-Content $backendEnvPath $content
        Write-Host "   ✅ Added $frontendUrl to ALLOWED_ORIGINS" -ForegroundColor Green
    } else {
        Write-Host "   ❌ File not found: $backendEnvPath" -ForegroundColor Red
    }
    
    # Create or update frontend .env
    Write-Host "`n📄 Updating frontend/.env..." -ForegroundColor White
    $frontendEnvPath = ".\.env"
    
    if (-not (Test-Path $frontendEnvPath)) {
        # Create new .env
        @"
VITE_API_URL=$backendUrl
VITE_APP_URL=$frontendUrl
"@ | Set-Content $frontendEnvPath
        Write-Host "   ✅ Created .env with ngrok URLs" -ForegroundColor Green
    } else {
        # Update existing .env
        $content = Get-Content $frontendEnvPath -Raw
        if ($content -match "VITE_API_URL=") {
            $content = $content -replace "VITE_API_URL=.*", "VITE_API_URL=$backendUrl"
        } else {
            $content += "`nVITE_API_URL=$backendUrl"
        }
        if ($content -match "VITE_APP_URL=") {
            $content = $content -replace "VITE_APP_URL=.*", "VITE_APP_URL=$frontendUrl"
        } else {
            $content += "`nVITE_APP_URL=$frontendUrl"
        }
        Set-Content $frontendEnvPath $content
        Write-Host "   ✅ Updated .env with ngrok URLs" -ForegroundColor Green
    }
    
    # ============================================
    # STEP 5: Summary & Next Steps
    # ============================================
    
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✅ Configuration Complete             ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
    
    Write-Host "`n📋 YOUR PUBLIC URLS:" -ForegroundColor Cyan
    Write-Host "   Frontend:  $frontendUrl" -ForegroundColor Yellow
    Write-Host "   Backend:   $backendUrl" -ForegroundColor Yellow
    
    Write-Host "`n🔄 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "   1. Keep the ngrok terminals running" -ForegroundColor White
    Write-Host "   2. Restart your backend server: cd backend && npm start" -ForegroundColor White
    Write-Host "   3. Restart your frontend server: npm run dev" -ForegroundColor White
    Write-Host "   4. Visit: $frontendUrl" -ForegroundColor White
    Write-Host "   5. Share the URL with others!" -ForegroundColor White
    
    Write-Host "`n📊 MONITORING:" -ForegroundColor Cyan
    Write-Host "   Dashboard: http://127.0.0.1:4040" -ForegroundColor Yellow
    
    Write-Host "`n⚠️  REMEMBER:" -ForegroundColor Yellow
    Write-Host "   • ngrok URLs expire when tunnels close" -ForegroundColor White
    Write-Host "   • Free tier URLs change each session" -ForegroundColor White
    Write-Host "   • Upgrade to ngrok Pro for static URLs" -ForegroundColor White
    
} else {
    Write-Host "`n💡 Manual configuration: Edit .env files directly" -ForegroundColor Green
    Write-Host "   backend/.env      - Set ALLOWED_ORIGINS" -ForegroundColor White
    Write-Host "   .env (or .env.local) - Set VITE_API_URL" -ForegroundColor White
}

Write-Host "`n"
Read-Host "Press Enter to exit"
