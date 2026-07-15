# HackerBoard

Premium dark UI for visual idea capture and next-step planning. A creative command center inspired by Huly's design language.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Fastify + TypeScript
- **Database:** SQLite via Prisma
- **Deployment:** PM2 on the VPS

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

## Wien Live

The `Wien Live` module adds a resilient, server-cached overview for Vienna:

- U2 Donaumarina live departures via Wiener Linien Open Data (20 s cache)
- Vienna weather via Open-Meteo (10 min cache)
- Traffic provider interface; TomTom is implemented when configured (3 min cache)
- Unified event model with a clearly marked mock provider until a reliable source is configured
- Combined endpoint: `GET /api/wien/dashboard`

All external APIs are called by the Fastify backend. No API key is exposed to the frontend. Copy `.env.example` and configure `TRAFFIC_PROVIDER=tomtom` plus `TRAFFIC_API_KEY` to activate live traffic data. Without a key the UI explicitly shows “Verkehrsdaten noch nicht eingerichtet”.

Additional routes:

```text
GET /api/wien/transit/stations?q=...
GET /api/wien/transit/departures?diva=60200282&line=U2
GET /api/wien/traffic
GET /api/wien/weather
GET /api/wien/events
```

## Deployment

Production runs directly via PM2. See `DOKUMENTATION.md` for the VPS deployment procedure.
