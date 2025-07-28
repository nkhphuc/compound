#!/bin/sh

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a condition with timeout
wait_for() {
    local max_attempts=$1
    local delay=$2
    local condition=$3
    local description=$4

    log "Waiting for: $description"
    for i in $(seq 1 $max_attempts); do
        if eval "$condition" >/dev/null 2>&1; then
            log "✓ $description is ready"
            return 0
        fi
        log "Attempt $i/$max_attempts: $description not ready yet, waiting..."
        sleep $delay
    done
    log "✗ Timeout waiting for: $description"
    return 1
}

log "Starting MinIO initialization..."

# Wait for MinIO to be ready
if ! wait_for 10 5 "mc alias set local http://minio:9000 minioadmin minioadmin" "MinIO service"; then
    log "ERROR: Cannot connect to MinIO after multiple attempts"
    exit 1
fi

# Test connection
if ! mc ls local >/dev/null 2>&1; then
    log "ERROR: Cannot connect to MinIO"
    exit 1
fi

log "Setting MinIO alias..."
mc alias set local http://minio:9000 minioadmin minioadmin

log "Creating bucket if not exists..."
mc mb --ignore-existing local/compound-uploads

log "Setting public read policy for compound-uploads bucket..."
mc anonymous set download local/compound-uploads

# Set bucket policy to allow public read access
log "Setting bucket policy..."
mc policy set download local/compound-uploads

# Verify the bucket exists and is accessible
log "Verifying bucket access..."
if mc ls local/compound-uploads >/dev/null 2>&1; then
    log "✓ Bucket 'compound-uploads' is accessible"
else
    log "✗ ERROR: Cannot access bucket 'compound-uploads'"
    exit 1
fi

log "MinIO initialization complete."
