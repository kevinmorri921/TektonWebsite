# ============================================
# TektonWebsite - Manual ngrok Tunnel Manager
# ============================================
# Use this script for more control over ngrok tunnels

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ngrok Tunnel Manager (Advanced)            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 OPTIONS:" -ForegroundColor Cyan
Write-Host "   1) Start Backend Tunnel (5000)" -ForegroundColor White
Write-Host "   2) Start Frontend Tunnel (5173)" -ForegroundColor White
Write-Host "   3) Start Both Tunnels" -ForegroundColor White
Write-Host "   4) Open ngrok Dashboard" -ForegroundColor White
Write-Host "   5) Check Configuration" -ForegroundColor White
Write-Host "   6) Exit" -ForegroundColor White

$choice = Read-Host "`n🎯 Select option (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 Starting Backend Tunnel (port 5000)..." -ForegroundColor Cyan
        Write-Host "📌 Copy the HTTPS URL and update backend/.env" -ForegroundColor Yellow
        Write-Host "   Set ALLOWED_ORIGINS to include the frontend ngrok URL" -ForegroundColor Yellow
        ngrok http 5000 --region us
    }
    "2" {
        Write-Host "`n🌐 Starting Frontend Tunnel (port 5173)..." -ForegroundColor Cyan
        Write-Host "📌 Copy the HTTPS URL and update frontend/.env" -ForegroundColor Yellow
        Write-Host "   Set VITE_APP_URL to this URL" -ForegroundColor Yellow
        ngrok http 5173 --region us
    }
    "3" {
        Write-Host "`n🌐 Starting Both Tunnels..." -ForegroundColor Cyan
        Write-Host "`n   Opening Backend tunnel in new window..." -ForegroundColor White
        $backendCmd = "ngrok http 5000 --region us; Read-Host 'Copy the URL above, then press Enter'"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
        
        Start-Sleep -Seconds 2
        Write-Host "   Opening Frontend tunnel in new window..." -ForegroundColor White
        $frontendCmd = "ngrok http 5173 --region us; Read-Host 'Copy the URL above, then press Enter'"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
        
        Write-Host "`n✅ Both tunnels started in separate windows" -ForegroundColor Green
        Write-Host "📌 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Note the backend URL (https://...ngrok.io)" -ForegroundColor White
        Write-Host "   2. Update backend/.env ALLOWED_ORIGINS" -ForegroundColor White
        Write-Host "   3. Note the frontend URL (https://...ngrok.io)" -ForegroundColor White
        Write-Host "   4. Update frontend/.env VITE_API_URL" -ForegroundColor White
        Read-Host "   5. Press Enter when done"
    }
    "4" {
        Write-Host "`n📊 Opening ngrok Dashboard..." -ForegroundColor Cyan
        Start-Process "http://127.0.0.1:4040"
        Write-Host "✅ Dashboard opened in browser" -ForegroundColor Green
        Read-Host "   Press Enter to return to menu"
    }
    "5" {
        Write-Host "`n🔍 Checking ngrok Configuration..." -ForegroundColor Cyan
        ngrok config check
        Write-Host "`n✅ Configuration check complete" -ForegroundColor Green
        Read-Host "   Press Enter to return to menu"
    }
    "6" {
        Write-Host "`n👋 Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "`n❌ Invalid option" -ForegroundColor Red
    }
}
