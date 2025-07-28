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

### Deployment

We provide a cross-platform Node.js deployment script that works on all platforms:

```bash
# Deploy the application
node deploy.js
```

### What the Deployment Does

The deployment script will:

1. 🔍 Auto-detect your LAN IP address for mobile access
2. 📁 Create necessary directories (`db/data`, `uploads`)
3. 🐳 Stop existing containers and build new ones
4. 🚀 Start all services (PostgreSQL, MinIO, Backend, Frontend, Nginx)
5. ⏳ Wait for services to be ready
6. 🔍 Run MinIO diagnostics to ensure upload functionality
7. 📊 Display service status and access URLs

### Access Your Application

After deployment, you can access:

- **Frontend**: <http://your-ip-address>
- **Backend API**: <http://your-ip-address/api>
- **Health Check**: <http://your-ip-address/health>
- **Mobile Access**: Same URLs from any device on the same network

### Troubleshooting

If you experience upload issues or other problems:

```bash
# Run comprehensive diagnostics
node troubleshoot.js

# For specific issues:
node troubleshoot.js --help
```

For detailed troubleshooting guidance, see `TROUBLESHOOTING.md`.

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Check service status
docker-compose ps
```

## 📝 Usage Notes

- **Multi-file upload:** Upload multiple files for each spectral field and structure image. Drag-and-drop and preview supported.
- **Bulk Excel export:** Select compounds on the main page, then click "Bulk Excel Export" to download a ZIP of Excel files.
- **Clear selection:** Use the "Clear All Selected" button to reset your selection.

---

For more details, see code comments and in-app help.
