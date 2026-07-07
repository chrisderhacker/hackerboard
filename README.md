# HackerBoard

Premium dark UI for visual idea capture and next-step planning. A creative command center inspired by Huly's design language.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Fastify + TypeScript
- **Database:** PostgreSQL
- **Deployment:** Docker Compose

## Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. Clone and install dependencies:
```bash
git clone https://github.com/chrisderhacker/hackerboard.git
cd hackerboard
cp .env.example .env

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

2. Start PostgreSQL and backend:
```bash
docker-compose up -d
```

3. Setup database:
```bash
cd backend
npx prisma migrate dev
cd ..
```

4. Start frontend dev server:
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3002/api

## Development

- Frontend hot reload: `npm run dev` in `/frontend`
- Backend hot reload: `npm run dev` in `/backend`
- Database migrations: `cd backend && npm run prisma:migrate`

## Building

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build
```

## Deployment

Uses Docker Compose for production deployment on VPS.
