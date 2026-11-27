# My Book Library

A personal PDF library built with React, Vite, Tailwind CSS, Express 5, Prisma, and Supabase.

## Setup

```bash
npm install
cp server/.env.example server/.env
# Fill in the Supabase database values and authentication secrets
npm run db:generate
npm run db:migrate
npm run db:seed
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` define the single account created by the seed. Re-running the seed resets that account's password and invalidates existing sessions.

## Development

Run the API and client in separate terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Vite proxies `/api` requests to the Express server.

## Production

### Requirements

- Node.js 22.13 or newer.
- A Supabase project with PostgreSQL and Storage available.
- A single origin for both the SPA and the API. The client calls `/api`, so
  serving `client/dist` from a separate static host will not work with the
  default configuration.
- HTTPS at the public edge. In production the auth cookie is `Secure`, so
  login will not work over plain HTTP.

### Environment

Copy `server/.env.example` to `server/.env` on the host, or supply the same
values as host environment variables. Required:

- `NODE_ENV=production`
- `PORT` (for example `4000`)
- `DATABASE_URL` (pooled Supabase connection)
- `DIRECT_URL` (direct Supabase connection for migrations)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (at least 32 random characters)

Optional:

- `SUPABASE_STORAGE_URL` (needed only when the automatic Storage host is wrong)
- `SUPABASE_STORAGE_BUCKET` (defaults to `books`)
- `SIGNED_PDF_URL_TTL_SECONDS` (defaults to `900`)
- `MAX_PDF_SIZE_MB` (defaults to `50`)
- `TRUST_PROXY` (set to `1` behind exactly one trusted TLS-terminating proxy;
  leave unset for direct hosting)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (only needed before running the seed)

### Deploy

```bash
npm ci
npm run db:generate
npm run build
npm run db:migrate:deploy
NODE_ENV=production npm start
```

`npm ci` also runs `prisma generate` through the server workspace's
`postinstall` script. `client/dist` must be present in the deployment artifact;
Express serves it as static files in production. The SPA fallback returns
`index.html` for unknown non-API `GET` routes, so direct links such as
`/dashboard` and `/books/:id/read` work. Unknown `/api/*` routes return JSON
errors instead of HTML.

The private Storage bucket is created automatically at startup. Do not make it
public.

### Database notes

- `npm run db:migrate:deploy` is the production migration command. Do not use
  `npm run db:migrate` in production; it is the interactive development
  command.
- `npm run db:migrate:status` reports applied migrations.
- The initial authentication migration adds `NOT NULL` columns, so it assumes a
  fresh database. Do not apply these migrations to an older populated
  database without a manual backfill.
- Run `npm run db:seed` once on a fresh database to create the single library
  account. Re-running it resets that account's password and signs out existing
  sessions.

Health check: `GET /api/health`
