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

### Useful Commands

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
