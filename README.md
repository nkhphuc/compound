# Compound Chemistry Application

A web application for managing chemical compound data with image upload capabilities.

## 🚀 Quick Start (One Command)

**To start the application on any computer:**

```bash
node start-app.js
```

This single command will:

1. ✅ Fix any line ending issues
2. ✅ Start all services (database, MinIO, backend, frontend)
3. ✅ Run diagnostics to verify everything works
4. ✅ Show you the URLs to access the application

## 📱 Access the Application

After running `node start-app.js`, open your browser to:

- **Main App**: <http://localhost>
- **MinIO Console**: <http://localhost:9001> (admin/minioadmin)

## 🛠️ Useful Commands

| Command | What it does |
|---------|-------------|
| `node start-app.js` | **Start everything** (recommended) |
| `node deploy.js` | Deploy without line ending fixes |
| `node deploy.js --diagnose` | Check if everything is working |
| `node troubleshoot.js` | Detailed troubleshooting |
| `docker-compose down` | Stop the application |

---

## 📋 Step-by-Step Setup

### Prerequisites

- Docker Desktop
- Node.js (version 16 or higher)

### Setup Process

1. **Navigate to project folder**

   ```bash
   cd /path/to/your/compound/project
   ```

2. **Start the application**

   ```bash
   node start-app.js
   ```

3. **Access the app**
   - Open browser to <http://localhost>
   - Upload images and test functionality

---

## 🆘 Troubleshooting

### Common Issues & Solutions

#### **Problem**: "Line ending errors" or "syntax errors"

**Solution**:

```bash
# Cross-platform solution
node fix-line-endings.js

# Then restart MinIO
docker-compose restart minio-init
```

#### **Problem**: "Access denied" or "Cannot connect to MinIO"

**Solution**:

```bash
node troubleshoot.js --fix-minio
```

#### **Problem**: "Port already in use"

**Solution**:

```bash
docker-compose down
node deploy.js
```

#### **Problem**: "Docker not running"

**Solution**:

1. Open Docker Desktop
2. Wait for it to fully start
3. Try again

#### **Problem**: Images show "URL ngoài" instead of preview

**Solution**:

```bash
node troubleshoot.js --fix-minio
```

#### **Problem**: Images don't upload at all

**Check**:

- File size (max 100MB)
- File type (JPEG, PNG, GIF, WebP, SVG)
- Run: `node troubleshoot.js`

### Platform-Specific Issues

#### Windows Users

- Use `node start-app.js` (recommended)
- Ensure Docker Desktop is running
- Run Command Prompt as Administrator if needed
- All scripts now work cross-platform with Node.js

#### Unix/Linux/macOS Users

- Use `node start-app.js` (recommended)
- Ensure Docker daemon is running
- Use `sudo` when needed for file operations

### Advanced Troubleshooting

#### Complete Reset (if nothing else works)

```bash
docker-compose down
sudo rm -rf ./uploads/*
sudo rm -rf ./db/data/*
node start-app.js
```

#### Check Service Status

```bash
node troubleshoot.js --services
```

#### Check MinIO Health

```bash
node troubleshoot.js --minio
```

#### Check Backend Health

```bash
node troubleshoot.js --backend
```

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs compound-backend
docker logs compound-minio
docker logs compound-frontend
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. `node deploy.js --diagnose` shows all green checkmarks ✅
2. You can access <http://localhost> in your browser
3. You can upload images without errors
4. Images display correctly in the compound view

---

## 🔄 Daily Usage

**To start the app:**

```bash
node start-app.js
```

**To stop the app:**

```bash
docker-compose down
```

**To restart if something breaks:**

```bash
node troubleshoot.js --restart
```

---

## 🔧 Development

### Project Structure

compound/
├── frontend/          # React application
├── backend/           # Express.js API
├── nginx/            # Reverse proxy
├── docker-compose.yml # Service orchestration
└── start-app.js      # One-command startup

### Architecture

All services are routed through nginx on port 80:

- Frontend: / (static files)
- Backend API: /api/*
- S3/MinIO: /s3/*
- Health Check: /health

---

## 🆘 Need Help?

1. **First**: Try `node start-app.js`
2. **If that fails**: Check the troubleshooting section above
3. **Still stuck**: Run `node troubleshoot.js` for automated fixes
4. **For detailed logs**: Check the logs section above

### Quick Reference

| Issue | Command | Expected Result |
|-------|---------|-----------------|
| Upload fails | `node troubleshoot.js --minio` | ✅ MinIO is healthy |
| Services not starting | `node troubleshoot.js --services` | ✅ All services running |
| Docker issues | `node troubleshoot.js --docker` | ✅ Docker is installed |
| Complete reset | `node troubleshoot.js --restart` | ✅ All services restarted |
| MinIO issues | `node troubleshoot.js --fix-minio` | ✅ MinIO fixed |
| Full diagnostic | `node troubleshoot.js` | ✅ All checks passed |
