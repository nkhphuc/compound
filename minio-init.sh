#!/bin/sh
set -e

# Wait for MinIO to be ready
sleep 10

echo "Setting MinIO alias..."
mc alias set local http://minio:9000 minioadmin minioadmin

echo "Creating bucket if not exists..."
mc mb --ignore-existing local/compound-uploads

echo "Setting public read policy..."
mc anonymous set download local/compound-uploads

# This is not working, but keep it here for reference
# echo "Setting CORS..."
# mc cors set local/compound-uploads /minio-cors.xml

echo "MinIO initialization complete."
