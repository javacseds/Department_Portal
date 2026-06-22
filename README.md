# 🎓 CDDAS — Smart College Department Documentation & Automation System

> Enterprise-grade, production-ready web application for managing all college department documentation, reports, files, approvals, and records from one centralized platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL 15+
- npm >= 10.0.0

### 1. Clone & Setup Environment
```bash
git clone <repo-url>
cd Application
cp .env.example .env
# Edit .env with your database credentials and secrets
```

### 2. Install Dependencies
```bash
npm install --workspaces
```

### 3. Setup Database
```bash
# Generate Prisma client
cd packages/database && npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (college, departments, super admin)
npx prisma db seed
```

### 4. Start Development Servers
```bash
# From root — starts all services via Turborepo
npm run dev

# Or individually:
# API: cd apps/api && npx ts-node src/server.ts
# Web: cd apps/web && npx next dev
```

### 5. Open in Browser
- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:4000
- 🏥 **Health**: http://localhost:4000/health

### Default Login
```
Email:    superadmin@cddas.edu
Password: Admin@123456
```

---

## 🏗️ Architecture

```
Application/
├── apps/
│   ├── web/          ← Next.js 14 (App Router) + TypeScript + Tailwind + MUI
│   └── api/          ← Node.js + Express + TypeScript
├── packages/
│   ├── database/     ← Prisma ORM + PostgreSQL schema
│   └── shared/       ← Shared types, constants, utils
├── docker/           ← NGINX config
├── docker-compose.yml
└── ecosystem.config.json (PM2)
```

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system control |
| `DEPARTMENT_ADMIN` | Department-level admin |
| `HOD` | Head of Department |
| `FACULTY` | Teaching faculty |
| `OFFICE_STAFF` | Administrative staff |
| `VIEW_ONLY` | Read-only access |
| `GUEST` | Limited public access |

---

## 📦 Modules

| Module | Status |
|--------|--------|
| Authentication (JWT + Refresh Tokens) | ✅ |
| Role-Based Access Control | ✅ |
| Dashboard with Charts | ✅ |
| Department Management | ✅ API / 🔄 UI |
| User Management | ✅ API / 🔄 UI |
| Faculty Management | ✅ API / 🔄 UI |
| Student Management | ✅ API / 🔄 UI |
| Event Management | ✅ API / 🔄 UI |
| File Manager + Sharp Processing | ✅ API / 🔄 UI |
| Dynamic Form Builder | 🔄 |
| Template Builder | 🔄 |
| PDF Generator (Puppeteer) | 🔄 |
| Excel Generator (ExcelJS) | 🔄 |
| Word Generator (docx) | 🔄 |
| Approval Workflow | ✅ API / 🔄 UI |
| Notification System (Socket.IO) | ✅ API / 🔄 UI |
| Activity & Audit Logs | ✅ API / 🔄 UI |
| Inventory & Stock | ✅ API / 🔄 UI |
| Reports | 🔄 |
| Backup & Restore | 🔄 |
| System Customization | 🔄 |
| Dark/Light Mode | ✅ |
| PWA Support | ✅ |
| Docker Deployment | ✅ |

---

## 🔐 Security Features
- JWT Access Tokens (15min) + Refresh Tokens (7 days) with httpOnly cookies
- RBAC with granular per-user permission overrides
- Helmet.js for HTTP security headers
- Rate limiting (100 req/15min global, 10 req/15min for auth)
- CORS protection
- SQL injection protection via Prisma ORM
- Input sanitization with sanitize-html
- File type validation on uploads
- Audit trail for all data changes
- Auto logout on token expiry

---

## 🐳 Docker Deployment
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📡 API Endpoints

### Auth
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/change-password
```

### Core Modules
```
GET|POST        /api/v1/departments
GET|PUT|DELETE  /api/v1/departments/:id
GET|POST        /api/v1/users
GET|POST        /api/v1/faculty
GET|POST        /api/v1/students
GET|POST        /api/v1/events
GET|POST        /api/v1/documents
GET|POST        /api/v1/templates
GET|POST        /api/v1/forms
GET|POST        /api/v1/files
GET             /api/v1/dashboard/stats
GET             /api/v1/dashboard/calendar
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS + Material UI v5 |
| State | Redux Toolkit + TanStack Query |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT + Refresh Tokens |
| Files | Multer + Sharp |
| Excel | ExcelJS |
| PDF | Puppeteer + PDFMake |
| Word | docx |
| Real-time | Socket.IO |
| Logging | Winston + Daily Rotate |
| Deploy | Docker + NGINX + PM2 |

---

## 📋 Environment Variables

See [.env.example](.env.example) for all configuration options.

---

*Built with ❤️ for Indian College Administration*
