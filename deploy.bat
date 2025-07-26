@echo off
setlocal enabledelayedexpansion

echo 🚀 Deploying Compound Chemistry Data Manager...

REM Auto-detect LAN IP for display purposes
echo 🔍 Detecting LAN IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%i"
    set "ip=!ip: =!"
    if not "!ip!"=="127.0.0.1" (
        set "LAN_IP=!ip!"
        goto :ip_found
    )
)

:ip_found
if "%LAN_IP%"=="" (
    echo ⚠️  Could not auto-detect LAN IP, using localhost
    set "LAN_IP=localhost"
) else (
    echo ✅ Detected LAN IP: %LAN_IP%
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "db\data" mkdir "db\data"
if not exist "uploads" mkdir "uploads"

REM Build and start the application
echo 🔨 Building and starting the application...
docker-compose down
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose ps

echo ✅ Deployment complete!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://%LAN_IP%
echo    Backend API: http://%LAN_IP%/api
echo    S3/MinIO: http://%LAN_IP%/s3
echo    Health Check: http://%LAN_IP%/health
echo.
echo 📱 Mobile Access:
echo    Your app is now configured for mobile access!
echo    Make sure your mobile device is on the same WiFi network
echo    Access from mobile: http://%LAN_IP%
echo.
echo 🔧 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    View nginx logs: docker-compose logs nginx
echo    View frontend logs: docker-compose logs frontend
echo    View backend logs: docker-compose logs backend
echo.
echo 🛠️  Troubleshooting:
echo    If mobile access doesn't work, check your firewall settings:
echo    - Windows: Windows Defender Firewall
echo.
echo 📋 Architecture:
echo    All services are now routed through nginx on port 80:
echo    - Frontend: / (static files)
echo    - Backend API: /api/*
echo    - S3/MinIO: /s3/*
echo    - Health Check: /health

pause
