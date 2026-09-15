# TGR — Gym Progress

Production-ready full-stack fitness analytics app.

## Stack
- **Frontend:** React + Vite (JavaScript) + Tailwind + React Router + Recharts + Lucide
- **Backend:** Node.js + Express
- **Database:** MySQL 8 + Prisma
- **Auth:** Email/password (bcrypt + JWT HttpOnly cookie) + Google OAuth 2.0 / OIDC
- **Docker:** Compose (db + server + client)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

### Demo credentials (dev seed only)
- Email: `demo@gymprogress.dev`
- Password: `Demo1234!`

## Local development

### 1. Database
```bash
docker compose up -d db
```

### 2. Server
```bash
cd server
cp ../.env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### 3. Client
```bash
cd client
npm install
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `PORT` | Backend port (default 4000) |
| `NODE_ENV` | `development` / `production` |
| `JWT_SECRET` | Secret for signing JWTs (>= 32 chars) |
| `CLIENT_URL` | Public frontend URL (CORS + OAuth redirects) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Must match redirect URI in Google Cloud Console |
| `VITE_API_URL` | Frontend API base URL |

## Google OAuth setup

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth Client ID (Web).
2. Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`.
3. Authorized JavaScript origin: `http://localhost:5173`.
4. Paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `.env`.

## Prisma

```bash
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma migrate deploy
node prisma/seed.js
```

## API overview

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `GET /api/auth/google` → `GET /api/auth/google/callback`
- `POST /api/auth/google/unlink`
- `GET/POST /api/exercises`, `GET/DELETE /api/exercises/:id`
- `GET/POST /api/workouts`, `GET/PUT/DELETE /api/workouts/:id`
- `POST /api/workouts/:id/finish`
- `POST /api/workouts/:id/exercises`, `DELETE /api/workouts/:id/exercises/:weId`
- `POST /api/workouts/exercises/:weId/sets`, `PUT/DELETE /api/workouts/sets/:setId`
- `POST /api/workouts/exercises/:weId/duplicate-previous`
- `GET /api/bodyweight`, `GET /api/bodyweight/stats`, `POST/PUT/DELETE /api/bodyweight`
- `GET /api/prs`, `/api/prs/recent`, `/api/prs/best`
- `GET /api/calendar?year=&month=`
- `GET /api/analytics/overview`, `/api/analytics/streak`, `/api/analytics/exercise/:id/progression`
- `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`
- `GET/PUT /api/profile`, `PUT /api/profile/password`, `GET/POST /api/profile/schedule`

## Security
- bcrypt (12 rounds), JWT in HttpOnly cookie
- Google OAuth state validation
- Helmet, CORS allowlist, rate-limited auth
- Prisma parameterized queries, all data scoped by `req.user.id`