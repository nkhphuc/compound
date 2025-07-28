# Troubleshooting Guide

## Image Upload Issues

### Problem: "Access Denied" when uploading images

This issue typically occurs when running the application on a different computer or after a fresh deployment. Here are the steps to resolve it:

#### Quick Fix

1. **Deploy with diagnostics:**

   ```bash
   # Windows
   node deploy.js

   # Unix/Linux/macOS
   node deploy.js
   ```

2. **If upload issues persist, run diagnostics:**

   ```bash
   # Windows
   node troubleshoot.js

   # Unix/Linux/macOS
   node troubleshoot.js
   ```

3. **If the deployment script doesn't work, manually restart:**

   ```bash
   docker-compose down
   docker-compose up -d
   ```

#### Diagnostic Steps

1. **Run the diagnostic script:**

   ```bash
   # Windows
   node troubleshoot.js

   # Unix/Linux/macOS
   node troubleshoot.js
   ```

2. **Check MinIO logs:**

   ```bash
   docker logs compound-minio
   ```

3. **Check backend logs:**

   ```bash
   docker logs compound-backend
   ```

#### Step-by-Step Troubleshooting

##### 1. Check Docker Status

```bash
# Windows
node troubleshoot.js --docker

# Unix/Linux/macOS
node troubleshoot.js --docker
```

This will verify:

- Docker Desktop/Docker is installed and running
- Docker Compose is available
- Docker daemon is accessible

##### 2. Check Service Status

```bash
# Windows
node troubleshoot.js --services

# Unix/Linux/macOS
node troubleshoot.js --services
```

This will show:

- Which services are running
- Which services have issues
- Service status and health

##### 3. Check MinIO Health

```bash
# Windows
node troubleshoot.js --minio

# Unix/Linux/macOS
node troubleshoot.js --minio
```

This will verify:

- MinIO container is running
- Bucket exists and is accessible
- File upload permissions are correct

##### 4. Check Backend Health

```bash
# Windows
node troubleshoot.js --backend

# Unix/Linux/macOS
node troubleshoot.js --backend
```

This will check:

- Backend container is running
- API is responding
- Recent error logs

#### Automated Fixes

##### Fix MinIO Issues

```bash
# Windows
node troubleshoot.js --fix-minio

# Unix/Linux/macOS
node troubleshoot.js --fix-minio
```

This will:

- Restart MinIO container
- Create the bucket if missing
- Set proper permissions
- Configure public read access

##### Restart All Services

```bash
# Windows
node troubleshoot.js --restart

# Unix/Linux/macOS
node troubleshoot.js --restart
```

This will:

- Stop all services
- Remove orphaned containers
- Start all services fresh
- Wait for proper initialization

#### Common Solutions

##### 1. MinIO Bucket Not Created

If the diagnostic shows "Bucket 'compound-uploads' not found":

```bash
# Windows
node troubleshoot.js --fix-minio

# Unix/Linux/macOS
node troubleshoot.js --fix-minio
```

##### 2. Network Connectivity Issues

If backend cannot reach MinIO:

```bash
# Check if containers are on the same network
docker network ls
docker network inspect compound_compound-network
```

##### 3. Permission Issues

If you see "AccessDenied" errors:

```bash
# Windows
node troubleshoot.js --restart

# Unix/Linux/macOS
node troubleshoot.js --restart
```

#### Manual Commands (if scripts don't work)

##### 1. Restart Services Manually

```bash
docker-compose down
docker-compose up -d
```

##### 2. Check MinIO Logs

```bash
docker logs compound-minio
```

##### 3. Check Backend Logs

```bash
docker logs compound-backend
```

##### 4. Manually Create MinIO Bucket

```bash
docker exec compound-minio mc mb local/compound-uploads
docker exec compound-minio mc anonymous set download local/compound-uploads
docker exec compound-minio mc policy set download local/compound-uploads
```

#### Environment Variables

Ensure these environment variables are set correctly in the backend:

- `S3_ENDPOINT=http://minio:9000`
- `S3_ACCESS_KEY=minioadmin`
- `S3_SECRET_KEY=minioadmin`
- `S3_BUCKET=compound-uploads`

### Problem: Images show "URL ngoài" instead of preview

This happens when the image URLs are not constructed correctly.

#### Solution

1. **Check the URL construction in the browser console**
2. **Verify nginx routing is working:**

   ```bash
   # Test nginx routing
   curl -I http://localhost/s3/compound-uploads/test.jpg
   ```

3. **Check if MinIO is serving files correctly:**

   ```bash
   # Test direct MinIO access
   curl -I http://localhost:9001/compound-uploads/test.jpg
   ```

### Problem: Images don't upload at all

#### Check File Size Limits

The application supports files up to 100MB. If you're trying to upload larger files:

1. Check the file size
2. Consider compressing the image
3. Use a different image format

#### Check File Type

Supported image formats:

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)

### Platform-Specific Issues

#### Windows-Specific Issues

##### 1. Docker Desktop Not Running

**Symptoms**: "Docker daemon is not running"
**Solution**:

1. Open Docker Desktop
2. Wait for it to fully start
3. Check system tray for Docker icon

##### 2. Port Conflicts

**Symptoms**: "Port already in use"
**Solution**:

```cmd
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :5432
netstat -ano | findstr :9001

# Unix/Linux/macOS
lsof -i :80
lsof -i :5432
lsof -i :9001
```

Then kill the conflicting process or change ports in `docker-compose.yml`

##### 3. File Permission Issues

**Symptoms**: "Access denied" or "Permission denied"
**Solution**:

1. **Windows**: Run Command Prompt as Administrator
2. **Unix/Linux/macOS**: Use sudo or fix permissions
3. Navigate to your project directory
4. Run the deployment script again

##### 4. Antivirus Blocking (Windows)

**Symptoms**: Containers can't start or network issues
**Solution**:

1. Add Docker Desktop to antivirus exclusions
2. Add your project folder to antivirus exclusions
3. Temporarily disable antivirus for testing

#### Shell Script Compatibility Issues

##### 1. MinIO Initialization Script Errors

**Symptoms**:

```
/minio-init.sh: line 2: set: -e
set: usage: set [-abefhkmnptuvxBCHP] [-o option-name] [--] [arg...]
```

**Solution**: The script has been updated to be compatible with different shell environments. If you still see this error:

1. Restart the MinIO initialization container:

   ```bash
   docker-compose restart minio-init
   ```

2. Check the logs:

   ```bash
   docker logs compound-minio-init-1
   ```

3. If the issue persists, manually create the bucket:

   ```bash
   docker exec compound-minio mc mb local/compound-uploads
   docker exec compound-minio mc anonymous set download local/compound-uploads
   docker exec compound-minio mc policy set download local/compound-uploads
   ```

### Advanced Troubleshooting

#### 1. Complete Reset

If nothing else works, perform a complete reset:

```bash
# Stop all services
docker-compose down

# Remove all data
sudo rm -rf ./uploads/*
sudo rm -rf ./db/data/*

# Restart everything
docker-compose up -d
```

#### 2. Check Docker Resources

Ensure Docker has enough resources allocated:

- Memory: At least 2GB
- CPU: At least 2 cores
- Disk space: At least 5GB free

#### 3. Network Issues

If containers can't communicate:

```bash
docker network ls
docker network inspect compound_compound-network
```

#### 4. File System Issues

If uploads fail due to file system:

```bash
docker exec compound-minio ls -la /data
docker exec compound-backend ls -la /app
```

### Log Analysis

#### Backend Upload Logs

Look for these log messages in the backend:

- `✓ Bucket compound-uploads is accessible` - Good
- `❌ Bucket access error` - MinIO connection issue
- `✓ File uploaded successfully` - Upload worked
- `❌ Error uploading file` - Upload failed

#### MinIO Logs

Look for these in MinIO logs:

- `API: SYSTEM()` - Normal operation
- `ERROR` - MinIO errors
- `Access Denied` - Permission issues

### Getting Help

If you're still experiencing issues:

1. **Collect logs:**

   ```bash
   docker-compose logs > logs.txt
   docker logs compound-minio > minio-logs.txt
   docker logs compound-backend > backend-logs.txt
   ```

2. **Run diagnostic:**

   ```bash
   node troubleshoot.js > diagnostic.txt
   ```

3. **Check the troubleshooting output and share relevant error messages**

4. **Common error patterns:**
   - "Access Denied" → MinIO permissions issue
   - "Connection refused" → Service not running
   - "Port already in use" → Port conflict
   - "File not found" → Missing bucket or file

### Prevention

To prevent these issues in the future:

1. **Always use the deployment script when deploying to a new machine:**

   ```bash
   node deploy.js
   ```

2. **Check service health before using the application:**

   ```bash
   node troubleshoot.js
   ```

3. **Monitor logs during first upload:**

   ```bash
   docker logs -f compound-backend
   ```

4. **Keep Docker updated**

5. **Ensure sufficient system resources**

### Quick Reference

| Issue | Command | Expected Result |
|-------|---------|-----------------|
| Upload fails | `node troubleshoot.js --minio` | ✅ MinIO is healthy |
| Services not starting | `node troubleshoot.js --services` | ✅ All services running |
| Docker issues | `node troubleshoot.js --docker` | ✅ Docker is installed |
| Complete reset | `node troubleshoot.js --restart` | ✅ All services restarted |
| MinIO issues | `node troubleshoot.js --fix-minio` | ✅ MinIO fixed |
| Full diagnostic | `node troubleshoot.js` | ✅ All checks passed |

### Platform Notes

#### Windows Users

- Use `node deploy.js` and `node troubleshoot.js`
- Ensure Docker Desktop is running before deployment
- Run Command Prompt as Administrator if you encounter permission issues

#### Unix/Linux/macOS Users

- Use `node deploy.js` and `node troubleshoot.js`
- Ensure Docker daemon is running before deployment
- Use `sudo` when needed for file operations
