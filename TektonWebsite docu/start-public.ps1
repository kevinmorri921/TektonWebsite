# ============================================
# TektonWebsite - Public ngrok Startup Script
# ============================================
# This script starts your backend, frontend, and ngrok tunnels
# Usage: .\start-public.ps1

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   TektonWebsite - ngrok Public Access Launcher     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green

# Configuration
$BACKEND_PORT = 5000
$FRONTEND_PORT = 5173
$NGROK_REGION = "us"
$PROJECT_ROOT = Get-Location

# ============================================
# Pre-flight Checks
# ============================================

Write-Host "`n[1/5] 🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ngrok not found in PATH" -ForegroundColor Red
    Write-Host "`n📥 Install ngrok:" -ForegroundColor Yellow
    Write-Host "   scoop install ngrok" -ForegroundColor Yellow
    Write-Host "   OR download from https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

$ngrokVersion = ngrok --version 2>&1
Write-Host "✅ ngrok found: $ngrokVersion" -ForegroundColor Green

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green

# ============================================
# Authentication Check
# ============================================

Write-Host "`n[2/5] 🔐 Checking ngrok authentication..." -ForegroundColor Cyan
try {
    ngrok config check 2>&1 | Out-Null
    Write-Host "✅ ngrok authenticated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ngrok authentication may not be configured" -ForegroundColor Yellow
    Write-Host "`n📝 To authenticate:" -ForegroundColor Yellow
    Write-Host "   1. Get your token: https://dashboard.ngrok.com/auth/your-authtoken" -ForegroundColor Yellow
    Write-Host "   2. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
    Write-Host "   3. Then run this script again" -ForegroundColor Yellow
    Read-Host "Continue anyway? (Press Enter or Ctrl+C to exit)"
}

# ============================================
# Port Availability Check
# ============================================

Write-Host "`n[3/5] 🔌 Checking ports..." -ForegroundColor Cyan

$port5000 = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "⚠️  Port $BACKEND_PORT is already in use" -ForegroundColor Yellow
    Write-Host "   Process: $(Get-Process -Id $port5000.OwningProcess -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)" -ForegroundColor Yellow
}

$port5173 = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "⚠️  Port $FRONTEND_PORT is already in use" -ForegroundColor Yellow
    Write-Host "   Process: $(Get-Process -Id $port5173.OwningProcess -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)" -ForegroundColor Yellow
}

if (-not $port5000 -and -not $port5173) {
    Write-Host "✅ Ports $BACKEND_PORT and $FRONTEND_PORT are available" -ForegroundColor Green
}

# ============================================
# Start Services
# ============================================

Write-Host "`n[4/5] 🚀 Starting services..." -ForegroundColor Cyan

# Start Backend
Write-Host "`n   📦 Backend (port $BACKEND_PORT)..." -ForegroundColor White
$backendCmd = "Set-Location '$PROJECT_ROOT\backend'; npm start; Read-Host 'Press Enter to close backend terminal'"
$backendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru
Write-Host "      ✅ Started (PID: $($backendProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`n   🎨 Frontend (port $FRONTEND_PORT)..." -ForegroundColor White
$frontendCmd = "Set-Location '$PROJECT_ROOT'; npm run dev; Read-Host 'Press Enter to close frontend terminal'"
$frontendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCmd -PassThru
Write-Host "      ✅ Started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# ============================================
# Start ngrok Tunnels
# ============================================

Write-Host "`n[5/5] 🌐 Starting ngrok tunnels..." -ForegroundColor Cyan
Write-Host "`n   Backend tunnel..." -ForegroundColor White
$backendTunnelCmd = "ngrok http $BACKEND_PORT --region $NGROK_REGION"
$backendTunnelProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendTunnelCmd -PassThru
Write-Host "      ✅ Started (PID: $($backendTunnelProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host "`n   Frontend tunnel..." -ForegroundColor White
$frontendTunnelCmd = "ngrok http $FRONTEND_PORT --region $NGROK_REGION"
$frontendTunnelProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendTunnelCmd -PassThru
Write-Host "      ✅ Started (PID: $($frontendTunnelProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 2

# ============================================
# Display Information
# ============================================

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ All Services Running               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 SERVICE INFORMATION:" -ForegroundColor Cyan
Write-Host "   Local Backend:     http://localhost:$BACKEND_PORT" -ForegroundColor White
Write-Host "   Local Frontend:    http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host "`n📊 MONITORING:" -ForegroundColor Cyan
Write-Host "   ngrok Dashboard:   http://127.0.0.1:4040" -ForegroundColor Yellow
Write-Host "`n📌 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Check the ngrok tunnel terminals for your public URLs" -ForegroundColor White
Write-Host "   2. Copy the HTTPS URLs (e.g., https://abc123.ngrok.io)" -ForegroundColor White
Write-Host "   3. Add them to backend/.env ALLOWED_ORIGINS" -ForegroundColor White
Write-Host "   4. Restart the backend server" -ForegroundColor White
Write-Host "   5. Update frontend/.env with VITE_API_URL" -ForegroundColor White
Write-Host "`n⏹️  TO STOP: Press Ctrl+C here" -ForegroundColor Yellow
Write-Host "`n"

# Keep script running
try {
    while ($true) { Start-Sleep -Seconds 1 }
} catch {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Yellow
}

# Cleanup
Write-Host "   Stopping backend..." -ForegroundColor Gray
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "   Stopping frontend..." -ForegroundColor Gray
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "   Stopping backend tunnel..." -ForegroundColor Gray
Stop-Process -Id $backendTunnelProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "   Stopping frontend tunnel..." -ForegroundColor Gray
Stop-Process -Id $frontendTunnelProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ All services stopped" -ForegroundColor Green
