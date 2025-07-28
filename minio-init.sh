#!/bin/sh
set -e

echo "Starting MinIO initialization..."

# Wait for MinIO to be ready with retry logic
echo "Waiting for MinIO to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if mc alias set local http://minio:9000 minioadmin minioadmin > /dev/null 2>&1; then
    echo "MinIO is ready!"
    break
  fi
  echo "Attempt $i: MinIO not ready yet, waiting..."
  sleep 5
done

# Test connection
if ! mc ls local > /dev/null 2>&1; then
  echo "ERROR: Cannot connect to MinIO"
  exit 1
fi

echo "Setting MinIO alias..."
mc alias set local http://minio:9000 minioadmin minioadmin

echo "Creating bucket if not exists..."
mc mb --ignore-existing local/compound-uploads

echo "Setting public read policy for compound-uploads bucket..."
mc anonymous set download local/compound-uploads

# Set bucket policy to allow public read access
echo "Setting bucket policy..."
mc policy set download local/compound-uploads

# Verify the bucket exists and is accessible
echo "Verifying bucket access..."
if mc ls local/compound-uploads > /dev/null 2>&1; then
  echo "✓ Bucket 'compound-uploads' is accessible"
else
  echo "✗ ERROR: Cannot access bucket 'compound-uploads'"
  exit 1
fi

echo "MinIO initialization complete."
