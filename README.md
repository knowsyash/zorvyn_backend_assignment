# Zorvyn Backend Assignment

Production-ready Finance Dashboard backend API built with Node.js, Express, TypeScript, MongoDB (Mongoose), JWT auth, role-based access, and Swagger docs.

## Repository Structure

This repository is a monorepo-style layout with the backend in a subfolder:

- `finance-dashboard-api/` -> main API project

All commands below are run from `finance-dashboard-api/` unless stated otherwise.

## Features

- JWT authentication (Bearer token + HttpOnly cookie support)
- Role-based authorization (`viewer`, `analyst`, `admin`)
- CRUD APIs for financial records
- Dashboard analytics endpoints
- Swagger UI with auto token capture after login
- Demo seed/reset endpoints for interview/recruiter demos
- MongoDB persistence with explicit database name (`MONGO_DB_NAME`)
- Automated smoke test script covering end-to-end flow
- Render deployment-ready TypeScript build setup

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB Atlas + Mongoose
- Zod validation
- JWT
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)
- Jest + Supertest

## Local Setup

1. Clone repository
2. Open terminal and go to API folder:

```bash
cd finance-dashboard-api
```

3. Install dependencies:

```bash
npm install
```

4. Create `.env` file (or copy `.env.example`) with at least:

```dotenv
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=finance-dashboard

JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d

ENABLE_DEMO_SEED=true
ENABLE_DEMO_RESET_ENDPOINT=true

DEMO_ADMIN_EMAIL=admin@finance.com
DEMO_ADMIN_PASSWORD=admin123
DEMO_ANALYST_EMAIL=analyst@finance.com
DEMO_ANALYST_PASSWORD=analyst123
DEMO_VIEWER_EMAIL=viewer@finance.com
DEMO_VIEWER_PASSWORD=viewer123
```

5. Start development server:

```bash
npm run dev
```

## Run and Build Commands

- `npm run dev` -> start in watch mode with `tsx`
- `npm run build` -> production build with `tsc -p tsconfig.build.json`
- `npm run start` -> run compiled server (`dist/src/server.js`)
- `npm test` -> run Jest tests
- `npm run smoke` -> run end-to-end smoke test on `http://localhost:4000`
- `npm run smoke:4020` -> smoke test against `http://localhost:4020`

## API Docs (Swagger)

- Local docs URL: `http://localhost:4000/api/docs`
- Root URL (`/`) redirects to `/api/docs`
- Health checks:
	- `/health`
	- `/api/health`

Swagger behavior:

- Login token is auto-captured from `POST /api/auth/login`
- Token is auto-injected into subsequent requests
- Authorization state persists in browser storage

## Demo Accounts

- Admin: `admin@finance.com` / `admin123`
- Analyst: `analyst@finance.com` / `analyst123`
- Viewer: `viewer@finance.com` / `viewer123`

## Roles and Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records | Yes | Yes | Yes |
| View dashboard analytics | No | Yes | Yes |
| Create/update/delete records | No | No | Yes |
| Manage users | No | No | Yes |
| Trigger demo seed/reset | No | No | Yes |

## Render Deployment Guide

### 1. Render Service Settings

- Branch: `main`
- Root Directory: `finance-dashboard-api`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

### 2. Required Environment Variables in Render

Add these in Render Dashboard -> Service -> Settings -> Environment:

```dotenv
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=finance-dashboard

JWT_SECRET=<strong_random_secret>
JWT_EXPIRES_IN=7d

ENABLE_DEMO_SEED=true
ENABLE_DEMO_RESET_ENDPOINT=false

DEMO_ADMIN_EMAIL=admin@finance.com
DEMO_ADMIN_PASSWORD=admin123
DEMO_ANALYST_EMAIL=analyst@finance.com
DEMO_ANALYST_PASSWORD=analyst123
DEMO_VIEWER_EMAIL=viewer@finance.com
DEMO_VIEWER_PASSWORD=viewer123
```

Important:

- Render does not automatically use `.env.production` from your repo.
- Environment variables must be added in Render dashboard.
- After changing env vars, redeploy service.

### 3. Verify Deployment

After deploy succeeds, open:

- `<your-render-url>/`
- `<your-render-url>/api/docs`

Then test login and protected endpoints from Swagger.

## Troubleshooting (Real Issues Already Fixed)

### Error: `MONGO_URI is required and must point to a MongoDB Atlas cluster`

Cause:

- `MONGO_URI` missing in Render environment variables.

Fix:

- Add `MONGO_URI` in Render dashboard and redeploy.

### Error: `TS2688 Cannot find type definition file for 'jest'`

Cause:

- Production build was using config that included Jest types.

Fix applied:

- Build uses dedicated config `tsconfig.build.json` that excludes test/Jest context.

### Error: `TS7016 Could not find a declaration file for module 'cors'/'morgan'/...`

Cause:

- Render may install production dependencies only.
- Type packages needed by `tsc` were in `devDependencies`.

Fix applied:

- Required TypeScript and type packages moved to `dependencies`.

### Swagger opens but auth fails repeatedly

Cause:

- Token not persisted/injected.

Fix applied:

- Swagger request/response interceptors now auto-store and auto-attach token.

## Smoke Test Coverage

Smoke test verifies key happy-path behavior:

- health endpoint
- register
- login as viewer/admin
- role-based access checks
- demo seed/reset endpoints
- create/list records
- dashboard summary

Run:

```bash
npm run smoke
```

## Security Notes

- Do not commit real production credentials.
- Rotate `JWT_SECRET` periodically.
- Use dedicated demo data and database for recruiter demos.
- Keep `ENABLE_DEMO_RESET_ENDPOINT=false` in production unless intentionally needed.

## Project Status

- Build is production-ready for Render
- Root redirects to Swagger docs
- MongoDB database selection is explicit via `MONGO_DB_NAME`
- Demo seed flow is available for quick evaluation

---

If deployment fails again, copy the latest Render log block and map it against the Troubleshooting section above first.
