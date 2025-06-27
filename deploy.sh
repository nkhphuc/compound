#!/bin/bash

echo "🚀 Deploying Compound Chemistry Data Manager..."

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p db/data
mkdir -p uploads

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 uploads

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3002"
echo "   MinIO Console: http://localhost:9001"
echo "   Health Check: http://localhost/health"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
