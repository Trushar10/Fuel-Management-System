# Fuel Management System (Next.js + Turso)

Fleet fuel tracking and performance analytics dashboard built with Next.js App Router and Turso (libSQL).

## Stack

- Next.js 16 (App Router)
- React + Recharts
- Turso (libSQL) via `@libsql/client`

## Environment Variables

Copy `.env.example` to `.env.local` and fill Turso values:

```bash
cp .env.example .env.local
```

Required variables:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Local Development

```bash
npm install
npm run migrate:prod
npm run seed
npm run dev -- --port 3002
```

App URL: `http://localhost:3002`

## Production Migration Script

Migrations are in `migrations/*.sql` and tracked in `__migrations` table.

Run migrations against whichever Turso DB URL is in env:

```bash
npm run migrate:prod
```

Migration runner file: `scripts/migrate-prod.js`

## One-Click Vercel Deployment

### Option A: Vercel Import (UI)

1. Push this project to GitHub.
2. Import repository in Vercel.
3. Set environment variables:
	- `TURSO_DATABASE_URL`
	- `TURSO_AUTH_TOKEN`
4. Deploy.

`vercel.json` is already included for framework/build defaults and Mumbai region.

### Option B: One-Click Button (replace `YOUR_REPO_URL`)

```text
https://vercel.com/new/clone?repository-url=YOUR_REPO_URL&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN&envDescription=Turso%20database%20URL%20and%20auth%20token
```

## Post-Deploy Checklist

After first deploy, run migration once on production DB:

```bash
npm run migrate:prod
```

If needed, seed initial demo data:

```bash
npm run seed
```
