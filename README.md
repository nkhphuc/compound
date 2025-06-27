# Compound Chemistry Data Manager

A monorepo containing a full-stack application for managing chemical compound data with React frontend and Express.js backend.

## 🏗️ Project Structure

```
compound/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Express.js + TypeScript + PostgreSQL
├── shared/            # Shared types and utilities
├── package.json       # Root package.json for monorepo
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.6.0+ (managed via asdf)
- **pnpm**: 10.12.1+
- **PostgreSQL**: 12+ (for backend database)

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd compound
   pnpm install
   ```

2. **Set up PostgreSQL**:
   ```bash
   # Create database
   createdb compound_chemistry

   # Or using psql
   psql -U postgres
   CREATE DATABASE compound_chemistry;
   ```

3. **Configure environment**:
   ```bash
   # Copy backend environment file
   cp backend/env.example backend/.env

   # Edit backend/.env with your database credentials
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=compound_chemistry
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Run database migrations**:
   ```bash
   pnpm --filter backend db:migrate
   ```

5. **Start development servers**:
   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or start individually
   pnpm dev:frontend  # Frontend on http://localhost:5173
   pnpm dev:backend   # Backend on http://localhost:3001
   ```

## 📦 Available Scripts

### Root Level
- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm dev:frontend` - Start only frontend
- `pnpm dev:backend` - Start only backend
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Run TypeScript type checking

### Backend
- `pnpm --filter backend dev` - Start backend development server
- `pnpm --filter backend build` - Build backend
- `pnpm --filter backend db:migrate` - Run database migrations
- `pnpm --filter backend db:seed` - Seed database with sample data

### Frontend
- `pnpm --filter frontend dev` - Start frontend development server
- `pnpm --filter frontend build` - Build frontend for production

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **compounds**: Main compound data
- **nmr_data**: NMR spectroscopy data
- **nmr_signals**: Individual NMR signals

## 🔧 API Endpoints

### Compounds
- `GET /api/compounds` - Get all compounds (with pagination and search)
- `GET /api/compounds/:id` - Get compound by ID
- `POST /api/compounds` - Create new compound
- `PUT /api/compounds/:id` - Update compound
- `DELETE /api/compounds/:id` - Delete compound
- `GET /api/compounds/next-stt-hc` - Get next available serial number

### Health Check
- `GET /health` - Server health status

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **i18next** - Internationalization
- **Tailwind CSS** - Styling

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging

### Shared
- **TypeScript** - Shared type definitions
- **CommonJS** - Module system for compatibility

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compound_chemistry
DB_USER=postgres
DB_PASSWORD=your_password
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## 📝 Development

### Adding New Features
1. Update shared types in `shared/src/types.ts`
2. Build shared package: `pnpm --filter @compound/shared build`
3. Implement backend API endpoints
4. Update frontend to use new API
5. Test thoroughly

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

### Docker (Future)
Docker configuration can be added for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
