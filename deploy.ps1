#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Compound Chemistry Data Manager..." -ForegroundColor Green

# Auto-detect LAN IP for display purposes
Write-Host "🔍 Detecting LAN IP address..." -ForegroundColor Yellow

$LAN_IP = $null
try {
    # Get network adapters and find the first non-loopback IPv4 address
    $networkAdapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -notlike "*Loopback*" }

    foreach ($adapter in $networkAdapters) {
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" }
        if ($ipConfig) {
            $LAN_IP = $ipConfig.IPAddress
            break
        }
    }
} catch {
    Write-Host "⚠️  Could not auto-detect LAN IP using PowerShell, trying alternative method..." -ForegroundColor Yellow
    try {
        # Alternative method using ipconfig
        $ipconfig = ipconfig | Select-String "IPv4"
        foreach ($line in $ipconfig) {
            $ip = ($line -split ":")[1].Trim()
            if ($ip -ne "127.0.0.1") {
                $LAN_IP = $ip
                break
            }
        }
    } catch {
        Write-Host "⚠️  Could not auto-detect LAN IP, using localhost" -ForegroundColor Yellow
        $LAN_IP = "localhost"
    }
}

if (-not $LAN_IP) {
    Write-Host "⚠️  Could not auto-detect LAN IP, using localhost" -ForegroundColor Yellow
    $LAN_IP = "localhost"
} else {
    Write-Host "✅ Detected LAN IP: $LAN_IP" -ForegroundColor Green
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
if (-not (Test-Path "db\data")) {
    New-Item -ItemType Directory -Path "db\data" -Force | Out-Null
}
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}

# Build and start the application
Write-Host "🔨 Building and starting the application..." -ForegroundColor Yellow
docker-compose down
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$LAN_IP" -ForegroundColor White
Write-Host "   Backend API: http://$LAN_IP/api" -ForegroundColor White
Write-Host "   S3/MinIO: http://$LAN_IP/s3" -ForegroundColor White
Write-Host "   Health Check: http://$LAN_IP/health" -ForegroundColor White
Write-Host ""
Write-Host "📱 Mobile Access:" -ForegroundColor Cyan
Write-Host "   Your app is now configured for mobile access!" -ForegroundColor White
Write-Host "   Make sure your mobile device is on the same WiFi network" -ForegroundColor White
Write-Host "   Access from mobile: http://$LAN_IP" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose down" -ForegroundColor White
Write-Host "   Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   View nginx logs: docker-compose logs nginx" -ForegroundColor White
Write-Host "   View frontend logs: docker-compose logs frontend" -ForegroundColor White
Write-Host "   View backend logs: docker-compose logs backend" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Troubleshooting:" -ForegroundColor Cyan
Write-Host "   If mobile access doesn't work, check your firewall settings:" -ForegroundColor White
Write-Host "   - Windows: Windows Defender Firewall" -ForegroundColor White
Write-Host ""
Write-Host "📋 Architecture:" -ForegroundColor Cyan
Write-Host "   All services are now routed through nginx on port 80:" -ForegroundColor White
Write-Host "   - Frontend: / (static files)" -ForegroundColor White
Write-Host "   - Backend API: /api/*" -ForegroundColor White
Write-Host "   - S3/MinIO: /s3/*" -ForegroundColor White
Write-Host "   - Health Check: /health" -ForegroundColor White

Read-Host "Press Enter to continue"
