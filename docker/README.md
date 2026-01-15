# GreenHome Docker Setup

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
cd docker
docker-compose up -d
```

This will start:
- **app**: Python FastAPI backend with React frontend on port 5000
- **db**: PostgreSQL database on port 5432

### Option 2: Build and Run Manually

```bash
# Build the image
docker build -f docker/Dockerfile.frontend -t greenhome .

# Run with external database
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e SESSION_SECRET="your-secret-key" \
  greenhome
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret key for session encryption | Yes |
| `NODE_ENV` | Environment (production/development) | No |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | GCS bucket for file uploads | No |

## Database Setup

The docker-compose includes a PostgreSQL container. Default credentials:
- User: `greenhome`
- Password: `greenhome123`
- Database: `greenhome`

For production, use an external PostgreSQL database and set `DATABASE_URL` accordingly.

## Ports

- `5000`: Application (API + Frontend)
- `5432`: PostgreSQL (only in docker-compose)

## Building Frontend Only

If you need to rebuild just the frontend:

```bash
npm run build
```

Then restart the container to pick up the new build.
