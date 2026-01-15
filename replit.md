# GreenHome (НогоонГэр) - Green Building Certification Platform

## Overview

GreenHome is a web application for managing green building certification requests in Mongolia. The platform connects legal entities seeking building certifications with administrators and auditors who review and approve certification requests.

The application follows a multi-step workflow:
1. Legal entities submit certification requests with project details
2. Administrators review and provide price quotes
3. Contracts are signed and project files uploaded
4. Auditors are assigned to conduct audits
5. Administrators review audit results and issue certificates

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom green/eco-themed design system
- **Build Tool**: Vite with React plugin
- **File Uploads**: Uppy library with presigned URL support

### Backend Architecture
The project has dual backend implementations:

**Primary (Node.js/Express)**:
- Express.js server with TypeScript
- RESTful API endpoints under `/api`
- Session-based authentication via Replit Auth
- Modular route registration pattern

**Secondary (Python/FastAPI)**:
- FastAPI with SQLAlchemy ORM
- Mirrors the Express API structure
- Located in `python_backend/` directory

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (Node.js) / SQLAlchemy (Python)
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **User Roles**: Three roles - `legal_entity`, `admin`, `auditor`
- **Test Login**: Development-only test user system for role-based testing

### File Storage
- **Provider**: Google Cloud Storage via Replit Object Storage connector
- **Upload Flow**: Presigned URL pattern (request URL from backend, upload directly to storage)
- **Integration**: Custom ObjectUploader component using Uppy

### API Design
- Typed API routes defined in `shared/routes.ts`
- Zod schemas for request/response validation
- URL builder utility for parameterized routes

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **Replit Object Storage**: Google Cloud Storage-backed file storage
- **Replit Connectors**: GitHub integration for repository management

### Database
- PostgreSQL (provisioned via Replit)
- Connection via `DATABASE_URL` environment variable

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: GCS bucket for file uploads

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `@uppy/core` / `@uppy/dashboard`: File upload handling
- `@google-cloud/storage`: Object storage client
- `passport` / `openid-client`: Authentication
- `zod`: Schema validation