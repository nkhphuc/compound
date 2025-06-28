<!-- markdownlint-disable MD024 MD040 -->
# Compound Chemistry Data Manager

A monorepo containing a full-stack application for managing chemical compound data with React frontend and Express.js backend.

## 🏗️ Project Structure

```
compound/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Express.js + TypeScript + PostgreSQL
├── nginx/             # Nginx reverse proxy configuration
├── db/                # PostgreSQL data directory
├── uploads/           # File uploads directory
├── docker-compose.yml # Docker configuration
├── package.json       # Root package.json for monorepo
├── pnpm-workspace.yaml
├── minio-cors.xml     # MinIO CORS configuration
├── minio-init.sh      # MinIO initialization script
└── deploy.sh          # Deployment script
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.6.0+ (managed via asdf)
- **pnpm**: 10.12.1+
- **PostgreSQL**: 16+ (for backend database)
- **Docker & Docker Compose**: For containerized deployment

### Setup

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd compound
   pnpm install
   ```

2. **Set up PostgreSQL**:

   **Option A: Using Docker Compose (Recommended)**

   ```bash
   # Start PostgreSQL only
   docker-compose up -d postgres

   # Check if container is running
   docker ps

   # View logs if needed
   docker logs compound-postgres
   ```

   **Option B: Using Docker directly**

   ```bash
   # Pull and run PostgreSQL container
   docker run --name compound-postgres \
     -e POSTGRES_DB=compound_chemistry \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     -d postgres:16

   # Check if container is running
   docker ps

   # View logs if needed
   docker logs compound-postgres
   ```

   **Option C: Using createdb (if PostgreSQL is in your PATH)**

   ```bash
   # Create database directly
   createdb compound_chemistry
   ```

   **Option D: Using psql command line**

   ```bash
   # Connect to PostgreSQL as postgres user
   psql -U postgres

   # Create the database
   CREATE DATABASE compound_chemistry;

   # Exit psql
   \q
   ```

   **Option E: If PostgreSQL is installed via Homebrew (macOS)**

   ```bash
   # Start PostgreSQL service if not running
   brew services start postgresql

   # Create database
   createdb compound_chemistry
   ```

   **Option F: If you need to install PostgreSQL first**

   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Then create database
   sudo -u postgres createdb compound_chemistry
   ```

   **Troubleshooting:**
   - If you get "connection refused", make sure PostgreSQL is running
   - If you get "permission denied", you may need to create a user first:

     ```bash
     sudo -u postgres createuser --interactive
     # Follow prompts to create your user
     ```

   - For Docker: Make sure port 5432 is not already in use by another PostgreSQL instance

3. **Configure environment**:

   ```bash
   # Copy backend environment file
   cp backend/env.example backend/.env

   # Edit backend/.env with your database URL
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/compound_chemistry
   ```

4. **Run database migrations**:

   ```bash
   # Navigate to backend directory
   cd backend

   # Run migrations to create tables
   pnpm db:migrate

   # Or from root directory
   pnpm --filter backend db:migrate
   ```

5. **Start development servers**:

   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or start individually
   pnpm dev:frontend  # Frontend on http://localhost:5173
   pnpm dev:backend   # Backend on http://localhost:3002
   ```

## �� Available Scripts

### Root Level

- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm dev:frontend` - Start only frontend
- `pnpm dev:backend` - Start only backend
- `pnpm build` - Build all packages
- `pnpm build:frontend` - Build only frontend
- `pnpm build:backend` - Build only backend
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Run TypeScript type checking

### Backend

- `pnpm --filter backend dev` - Start backend development server
- `pnpm --filter backend build` - Build backend
- `pnpm --filter backend start` - Start production backend server
- `pnpm --filter backend db:migrate` - Run database migrations
- `pnpm --filter backend db:seed` - Seed database with sample data

### Frontend

- `pnpm --filter frontend dev` - Start frontend development server
- `pnpm --filter frontend build` - Build frontend for production
- `pnpm --filter frontend preview` - Preview production build

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

### compounds

Main compound data table with fields:

- `id` (UUID, Primary Key)
- `stt_hc` (SERIAL, Unique) - Compound serial number
- `ten_hc` (VARCHAR) - Compound name
- `ten_hc_khac` (VARCHAR) - Alternative names
- `loai_hc` (VARCHAR) - Compound type
- `status` (VARCHAR) - Status
- `ten_latin` (VARCHAR) - Latin name
- `ten_ta` (VARCHAR) - English name
- `ten_tv` (VARCHAR) - Vietnamese name
- `bpnc` (TEXT) - Boiling point
- `trang_thai` (VARCHAR) - Physical state
- `mau` (VARCHAR) - Color
- `uv_sklm` (JSONB) - UV spectroscopy data
- `diem_nong_chay` (VARCHAR) - Melting point
- `alpha_d` (VARCHAR) - Optical rotation
- `dung_moi_hoa_tan_tcvl` (TEXT) - Solvent solubility
- `ctpt` (TEXT) - Chemical formula
- `klpt` (VARCHAR) - Molecular weight
- `hinh_cau_truc` (TEXT) - Structural formula
- `cau_hinh_tuyet_doi` (BOOLEAN) - Absolute configuration
- `smiles` (TEXT) - SMILES notation
- `pho` (JSONB) - Spectroscopy data
- `dm_nmr_general` (TEXT) - NMR solvent
- `cart_coor` (TEXT) - Cartesian coordinates
- `img_freq` (VARCHAR) - Image frequency
- `te` (VARCHAR) - Temperature

### nmr_data_blocks

NMR data blocks table:

- `id` (UUID, Primary Key)
- `compound_id` (UUID, Foreign Key) - Reference to compounds
- `stt_bang` (SERIAL, Unique) - Table number
- `dm_nmr` (TEXT) - NMR solvent
- `tan_so_13c` (VARCHAR) - 13C frequency
- `tan_so_1h` (VARCHAR) - 1H frequency
- `luu_y_nmr` (TEXT) - NMR notes
- `tltk_nmr` (TEXT) - NMR references

### nmr_signals

Individual NMR signals table:

- `id` (UUID, Primary Key)
- `nmr_data_block_id` (UUID, Foreign Key) - Reference to nmr_data_blocks
- `vi_tri` (VARCHAR) - Signal position
- `scab` (TEXT) - Signal assignment
- `shac_j_hz` (TEXT) - Chemical shift and coupling
- `sort_order` (SERIAL) - Display order

## 🔧 API Endpoints

### Compounds

- `GET /api/compounds` - Get all compounds (with pagination and search)
- `GET /api/compounds/:id` - Get compound by ID
- `POST /api/compounds` - Create new compound
- `PUT /api/compounds/:id` - Update compound
- `DELETE /api/compounds/:id` - Delete compound
- `GET /api/compounds/next-stt-hc` - Get next available serial number
- `GET /api/compounds/next-stt-bang` - Get next available table number

### File Upload

- `POST /api/uploads` - Upload files to S3/MinIO storage

### Metadata

- `GET /api/meta/loai-hc` - Get all unique compound types
- `GET /api/meta/trang-thai` - Get all unique physical states
- `GET /api/meta/mau` - Get all unique colors

### Health Check

- `GET /health` - Server health status

## 🛠️ Technology Stack

### Frontend

- **React 19.1.0** - UI framework
- **TypeScript 5.7.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **React Router 7.6.2** - Client-side routing
- **i18next 23.10.0** - Internationalization
- **Tailwind CSS 4.1.11** - Styling
- **Heroicons 2.2.0** - Icons
- **ExcelJS 4.3.0** - Excel export functionality
- **docx 9.5.1** - Word document export

### Backend

- **Express.js 4.21.2** - Web framework
- **TypeScript 5.7.2** - Type safety
- **PostgreSQL 16** - Database
- **pg 8.13.1** - PostgreSQL client
- **Helmet 8.0.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing
- **Morgan 1.10.0** - HTTP request logging
- **Joi 17.13.3** - Data validation
- **express-fileupload 1.5.1** - File upload handling
- **AWS SDK 3.837.0** - S3/MinIO integration
- **UUID 11.0.2** - Unique identifier generation

### Development Tools

- **tsx 4.19.2** - TypeScript execution
- **ESLint 9.17.0** - Code linting
- **pnpm 10.12.1** - Package manager

## 🔒 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=3002
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/compound_chemistry

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# S3/MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=compound-uploads
```

## 📝 Development

### Adding New Features

1. Update types in respective frontend/backend directories
2. Implement backend API endpoints
3. Update frontend to use new API
4. Test thoroughly

### Database Changes

1. Update migration script in `backend/src/config/migrate.ts`
2. Run migration: `pnpm --filter backend db:migrate`
3. Update service layer if needed

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm --filter backend start
```

### Docker Deployment

The application includes Docker Compose configuration for easy deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

**Services included:**

- **PostgreSQL 16**: Database server
- **MinIO**: Object storage for file uploads
- **Backend**: Express.js API server
- **Frontend**: React application served via Nginx
- **Nginx**: Reverse proxy serving the application on port 80

**Database Migration:**
The backend container automatically runs database migrations on startup using the compiled JavaScript files. The migration script creates all necessary tables and indexes.

**Environment Variables:**
Docker Compose uses the following default environment variables:

- `DATABASE_URL=postgresql://postgres:your_password@postgres:5432/compound_chemistry`
- `S3_ENDPOINT=http://minio:9000`
- `S3_ACCESS_KEY=minioadmin`
- `S3_SECRET_KEY=minioadmin`
- `S3_BUCKET=compound-uploads`

You can override these by creating a `.env` file or modifying `docker-compose.yml`.

### Manual Docker Build

```bash
# Build backend only
docker-compose build backend

# Build frontend only
docker-compose build frontend

# Build all services
docker-compose build
```

### Deployment Script

Use the provided `deploy.sh` script for automated deployment:

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
