# Inventory Distribution System - Frontend

> Modern, type-safe React frontend for inventory and order management.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-06B6D4)](https://tailwindcss.com/)
[![ESLint](https://img.shields.io/badge/ESLint-9.39-4B32C3)](https://eslint.org/)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/MeladAdera/inventory-distribution-system-FE.git
cd inventory-distribution-system-FE

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

---

## ✨ Features

### Phase 0 ✅ (Complete)
- ✅ **Next.js 16** - React framework with TypeScript
- ✅ **Type Safety** - Strict TypeScript mode, Zod validation
- ✅ **State Management** - Zustand with localStorage persistence
- ✅ **Data Fetching** - TanStack Query with Axios client
- ✅ **Styling** - Tailwind CSS 4.3 with custom components
- ✅ **Code Quality** - ESLint, Prettier, Husky pre-commit hooks
- ✅ **Modular Architecture** - Feature-based folder structure

### Phase 1 🔄 (In Progress)
- 🔄 **Authentication** - Login, logout, token refresh
- 🔄 **Auth Guards** - Protected routes and role-based access
- 🔄 **Dashboard** - Main application interface

### Phase 2 📋 (Planned)
- 📋 **Inventory Management** - Create, read, update, delete items
- 📋 **Order Management** - Order tracking and fulfillment
- 📋 **Product Catalog** - Product management
- 📋 **User Management** - User administration
- 📋 **Audit Logs** - Activity tracking

---

## 🛠️ Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| **Next.js** | 16.2.7 | React framework |
| **React** | 19.2.7 | UI library |
| **TypeScript** | 6.0.3 | Type safety |
| **Tailwind CSS** | 4.3.0 | Styling |

### State & Data
| Tool | Version | Purpose |
|------|---------|---------|
| **Zustand** | 5.0.14 | State management |
| **TanStack Query** | 5.101.0 | Data fetching |
| **Axios** | 1.17.0 | HTTP client |
| **React Hook Form** | 7.78.0 | Form handling |

### Code Quality
| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 9.39.4 | Linting |
| **Prettier** | 3.8.3 | Code formatting |
| **Husky** | 9.1.7 | Git hooks |
| **Zod** | 4.4.3 | Validation |

---

## 📁 Project Structure

```
inventory-distribution-system-FE/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── (auth)/       # Auth routes
│   │   ├── (dashboard)/  # Dashboard routes
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   │
│   ├── features/         # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── inventory/    # Inventory feature
│   │   ├── orders/       # Orders feature
│   │   └── products/     # Products feature
│   │
│   ├── common/           # Shared utilities
│   │   ├── api/          # Axios client
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── layout/       # Layout components
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Utility functions
│   │   └── constants/    # App constants
│   │
│   ├── config/           # Configuration
│   └── providers/        # Context providers
│
├── docs/                 # Documentation
│   ├── features/         # Feature docs
│   ├── setup/            # Setup guides
│   ├── api/              # API docs
│   ├── deployment/       # Deployment guides
│   └── architecture/     # Architecture docs
│
├── .eslintrc.json       # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── next.config.ts       # Next.js configuration
└── package.json         # Dependencies
```

See [docs/README.md](docs/README.md) for detailed structure.

---

## 💻 Development

### Available Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Run production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing (Phase 2)
npm run test             # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Development Workflow

1. Create a branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push changes: `git push origin feature/feature-name`
4. Create a pull request on GitHub

### Git Hooks

Pre-commit hooks automatically:
- Run ESLint (auto-fix)
- Run Prettier (auto-format)
- Validate staged files

---

## 📖 Documentation

### Getting Started
- **[Quick Start](#quick-start)** - Setup and run locally
- **[docs/setup/installation.md](docs/setup/installation.md)** - Detailed setup
- **[docs/setup/development.md](docs/setup/development.md)** - Dev workflow

### Project Info
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current status & metrics
- **[UPDATES.md](UPDATES.md)** - Changelog
- **[PROGRESS.md](PROGRESS.md)** - Development progress

### Feature Documentation
- **[docs/features/FEATURE_TEMPLATE.md](docs/features/FEATURE_TEMPLATE.md)** - Template for features
- **[docs/features/auth.md](docs/features/auth.md)** - Authentication feature
- **[docs/features/inventory.md](docs/features/inventory.md)** - Inventory feature (Phase 1)

### Architecture
- **[docs/architecture/overview.md](docs/architecture/overview.md)** - System architecture
- **[docs/architecture/folder-structure.md](docs/architecture/folder-structure.md)** - Folder organization
- **[docs/architecture/data-flow.md](docs/architecture/data-flow.md)** - Data flow

### API Integration
- **[docs/api/overview.md](docs/api/overview.md)** - API architecture
- **[docs/api/endpoints.md](docs/api/endpoints.md)** - Available endpoints
- **[docs/api/authentication.md](docs/api/authentication.md)** - Auth flow

---

## 🔐 Environment Variables

Create `.env.local` in the root directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

See `.env.example` for all available variables.

---

## 🧪 Testing

### Manual Testing
- Dev server: `npm run dev`
- Visit [http://localhost:3000](http://localhost:3000)
- Test features in browser

### Automated Testing (Phase 2)
```bash
npm run test              # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Code Quality Checks
```bash
npm run lint             # ESLint
npm run format:check     # Prettier
```

---

## 🚀 Deployment

### Staging
```bash
# Build for staging
npm run build

# Deploy to staging environment
# See docs/deployment/staging.md
```

### Production
```bash
# Production-ready build
npm run build

# Deploy to production
# See docs/deployment/production.md
```

---

## 🔗 Related Projects

- **Backend API**: [inventory-distribution-system-BE](https://github.com/MeladAdera/inventory-distribution-system-BE)
- **Mobile App**: [Coming soon]

---

## 📊 Project Status

| Component | Status | Details |
|-----------|--------|---------|
| **PHASE 0** | ✅ Complete | Infrastructure & setup |
| **PHASE 1** | 🔄 In Progress | Auth & dashboard |
| **PHASE 2** | 📋 Planned | Core features |
| **PHASE 3** | 📋 Planned | Polish & optimization |

Current Version: **0.1.0** (PHASE 0 Complete)

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed metrics.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👤 Author

**Melad Adera**
- Email: meladhih@gmail.com
- GitHub: [@MeladAdera](https://github.com/MeladAdera)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure:
- [ ] Code passes ESLint
- [ ] Code is formatted with Prettier
- [ ] TypeScript strict mode compliant
- [ ] Documentation updated
- [ ] Tests added/updated (Phase 2+)

---

## 📞 Support

For issues and questions:
1. Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status
2. Read relevant [docs/README.md](docs/README.md)
3. Open an issue on GitHub

---

## 🎯 Roadmap

### Q2 2026
- [x] Phase 0: Infrastructure setup
- [ ] Phase 1: Authentication
- [ ] Phase 2: Core features

### Q3 2026
- [ ] Phase 3: Optimization
- [ ] Phase 4: Advanced features
- [ ] Mobile app launch

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed timeline.

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

**Last Updated**: June 9, 2026  
**Status**: ✅ PHASE 0 Complete  
**Version**: 0.1.0

For detailed information, see [docs/README.md](docs/README.md)
