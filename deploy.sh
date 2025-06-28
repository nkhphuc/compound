#!/bin/bash

echo "🚀 Deploying Compound Chemistry Data Manager..."

# Auto-detect LAN IP for S3_PUBLIC_ENDPOINT
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

# Set environment variable for S3_PUBLIC_ENDPOINT
export S3_PUBLIC_ENDPOINT="http://$LAN_IP:9000"
echo "🔗 S3_PUBLIC_ENDPOINT set to: $S3_PUBLIC_ENDPOINT"

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
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$LAN_IP"
echo "   Backend API: http://$LAN_IP:3002"
echo "   MinIO Console: http://$LAN_IP:9001"
echo "   Health Check: http://$LAN_IP/health"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
