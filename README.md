# Compound Chemistry Data Manager

A full-stack application for managing chemical compound data, supporting multi-file uploads, advanced search, and bulk Excel export. Built with React, Express.js, and PostgreSQL.

## ✨ Features

- Manage chemical compound data with rich metadata
- Multi-file upload for spectral data and structure images
- Bulk Excel export: select multiple compounds and export all as a ZIP of Excel files
- Advanced search and filtering
- Excel export for individual compounds
- File upload to S3/MinIO
- Responsive UI with i18n (English/Vietnamese)

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+
- Docker (optional, for containerized setup)

### Setup & Usage

```bash
# Clone and install dependencies
pnpm install

# Copy and edit backend environment file
cp backend/env.example backend/.env
# Edit backend/.env with your database URL

# Run database migrations
pnpm --filter backend db:migrate

# Start development servers (frontend & backend)
pnpm dev
# Or start individually
pnpm dev:frontend  # Frontend: http://localhost:5173
pnpm dev:backend   # Backend: http://localhost:3002
```

## 🐳 Production Deployment

### Prerequisites for Deployment

- Docker Desktop installed and running
- Docker Compose available
- Port 80 available on your machine

### Deployment Options

We provide multiple deployment scripts for different platforms:

#### Option 1: Bash Script (macOS/Linux/Git Bash)

```bash
# Make executable and run
chmod +x deploy.sh
./deploy.sh
```

#### Option 2: Windows Batch File

```cmd
# Double-click or run in Command Prompt
deploy.bat
```

#### Option 3: PowerShell Script (Windows)

```powershell
# Right-click → "Run with PowerShell" or run:
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

#### Option 4: Node.js Script (Cross-platform)

```bash
# Run with Node.js (works on all platforms)
node deploy.js
# Or make executable and run directly:
chmod +x deploy.js  # macOS/Linux only
./deploy.js
```

### What the Deployment Does

All deployment scripts will:

1. 🔍 Auto-detect your LAN IP address for mobile access
2. 📁 Create necessary directories (`db/data`, `uploads`)
3. 🐳 Stop existing containers and build new ones
4. 🚀 Start all services (PostgreSQL, MinIO, Backend, Frontend, Nginx)
5. ⏳ Wait for services to be ready
6. 📊 Display service status and access URLs

### Access Your Application

After deployment, you can access:

- **Frontend**: `http://your-ip-address`
- **Backend API**: `http://your-ip-address/api`
- **S3/MinIO**: `http://your-ip-address/s3`
- **Health Check**: `http://your-ip-address/health`

### Mobile Access

The application is configured for mobile access! Make sure your mobile device is on the same WiFi network and access `http://your-ip-address`.

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View specific service logs
docker-compose logs nginx
docker-compose logs frontend
docker-compose logs backend
```

### Development Commands

- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm --filter backend db:migrate` - Run backend DB migrations

## 📝 Usage Notes

- **Multi-file upload:** Upload multiple files for each spectral field and structure image. Drag-and-drop and preview supported.
- **Bulk Excel export:** Select compounds on the main page, then click "Bulk Excel Export" to download a ZIP of Excel files.
- **Clear selection:** Use the "Clear All Selected" button to reset your selection.

---

For more details, see code comments and in-app help.
