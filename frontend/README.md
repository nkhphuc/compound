<!-- markdownlint-disable MD040 -->
# Compound Chemistry Data Manager - Frontend

A React-based frontend application for managing chemical compound data with TypeScript, Vite, and modern UI components.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.6.0+ (managed via asdf)
- **pnpm**: 10.12.1+

### Setup

1. **Install dependencies**:

   ```bash
   cd frontend
   pnpm install
   ```

2. **Configure environment** (optional):

   ```bash
   # Copy environment example
   cp env.example .env

   # Edit .env if you need to change API URL
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

3. **Start development server**:

   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

## 🔧 Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Application Configuration
VITE_APP_TITLE=Compound Chemistry Data Manager
```

## 📦 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
frontend/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── icons/          # SVG icons
├── pages/              # Page components
├── services/           # API services
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
└── vite.config.ts      # Vite configuration
```

## 🔌 API Integration

The frontend communicates with the backend API through the `compoundService.ts` file. All API calls are configured via the `VITE_API_BASE_URL` environment variable.

### Key Features

- **Compound Management**: Create, read, update, and delete chemical compounds
- **File Uploads**: Upload structure images and spectral data files
- **Search & Pagination**: Server-side search and pagination
- **Form Validation**: Comprehensive form validation with error handling
- **Responsive Design**: Mobile-friendly interface
- **Internationalization**: Multi-language support with i18next

## 🛠️ Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **i18next** - Internationalization
- **Tailwind CSS** - Styling

## 📝 Development

### Adding New Features

1. Create new components in the `components/` directory
2. Add new pages in the `pages/` directory
3. Update types in `types.ts` if needed
4. Add API endpoints in `services/compoundService.ts`
5. Update routing in `App.tsx` if needed

### Code Style

- Use TypeScript for all new code
- Follow the existing component patterns
- Use Tailwind CSS for styling
- Add proper error handling for API calls
- Include loading states for async operations

## 🚀 Deployment

### Production Build

```bash
# Build the application
pnpm build

# Preview the build
pnpm preview
```

### Environment Configuration

For production deployment, make sure to set the correct `VITE_API_BASE_URL` environment variable to point to your production backend API.

## 🤝 Contributing

1. Follow the existing code patterns
2. Add proper TypeScript types
3. Include error handling
4. Test your changes thoroughly
5. Update documentation if needed
