#!/bin/bash

echo "🚀 Deploying Compound Chemistry Data Manager..."

# Auto-detect LAN IP for display purposes
echo "🔍 Detecting LAN IP address..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LAN_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+' | head -1)
else
    # Fallback for other systems
    LAN_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LAN_IP" ]; then
    echo "⚠️  Could not auto-detect LAN IP, using localhost"
    LAN_IP="localhost"
else
    echo "✅ Detected LAN IP: $LAN_IP"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p db/data
mkdir -p uploads

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 uploads

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose down && docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$LAN_IP"
echo "   Backend API: http://$LAN_IP/api"
echo "   S3/MinIO: http://$LAN_IP/s3"
echo "   Health Check: http://$LAN_IP/health"
echo ""
echo "📱 Mobile Access:"
echo "   Your app is now configured for mobile access!"
echo "   Make sure your mobile device is on the same WiFi network"
echo "   Access from mobile: http://$LAN_IP"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View nginx logs: docker-compose logs nginx"
echo "   View frontend logs: docker-compose logs frontend"
echo "   View backend logs: docker-compose logs backend"
echo ""
echo "🛠️  Troubleshooting:"
echo "   If mobile access doesn't work, check your firewall settings:"
echo "   - macOS: System Preferences > Security & Privacy > Firewall"
echo "   - Linux: sudo ufw status"
echo ""
echo "📋 Architecture:"
echo "   All services are now routed through nginx on port 80:"
echo "   - Frontend: / (static files)"
echo "   - Backend API: /api/*"
echo "   - S3/MinIO: /s3/*"
echo "   - Health Check: /health"
