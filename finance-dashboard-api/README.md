# Finance Dashboard Backend API

## Tech Stack

Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Zod

## Setup Instructions

- Clone repo
- Run `npm install`
- Copy `.env.example` to `.env` and fill in `JWT_SECRET`
- Run `npm run dev`

## Default Admin Credentials

email: admin@finance.com
password: admin123

## Roles & Permissions Table

| Action                  | Viewer | Analyst | Admin |
|-------------------------|--------|---------|-------|
| View records            |  ✅    |   ✅    |  ✅   |
| View dashboard summary  |  ❌    |   ✅    |  ✅   |
| Create/Update/Delete    |  ❌    |   ❌    |  ✅   |
| Manage users            |  ❌    |   ❌    |  ✅   |

## API Endpoints Summary

## Swagger Docs

- Open API docs UI at: `/api/docs`
- Local URL: `http://localhost:4000/api/docs`
- Use the Authorize button and pass: `Bearer <your-jwt-token>` for protected routes
- After authorizing as admin, use `POST /api/users/demo/seed` to refresh the demo Atlas data set from Swagger

### Health

| Method | Path | Auth Required | Role |
|--------|------|---------------|------|
| GET | /health | No | Public |

### Auth

| Method | Path | Auth Required | Role |
|--------|------|---------------|------|
| POST | /api/auth/register | No | Public |
| POST | /api/auth/login | No | Public |

### Users

| Method | Path | Auth Required | Role |
|--------|------|---------------|------|
| GET | /api/users | Yes | admin |
| GET | /api/users/:id | Yes | admin |
| PATCH | /api/users/:id | Yes | admin |
| PATCH | /api/users/:id/deactivate | Yes | admin |

### Financial Records

| Method | Path | Auth Required | Role |
|--------|------|---------------|------|
| GET | /api/records | Yes | viewer, analyst, admin |
| GET | /api/records/:id | Yes | viewer, analyst, admin |
| POST | /api/records | Yes | admin |
| PATCH | /api/records/:id | Yes | admin |
| DELETE | /api/records/:id | Yes | admin |

### Dashboard Analytics

| Method | Path | Auth Required | Role |
|--------|------|---------------|------|
| GET | /api/dashboard/summary | Yes | analyst, admin |
| GET | /api/dashboard/categories | Yes | analyst, admin |
| GET | /api/dashboard/recent?limit=10 | Yes | analyst, admin |
| GET | /api/dashboard/trends?year=2024 | Yes | analyst, admin |

## Assumptions Made

- Soft delete used instead of hard delete for audit trail
- Viewers cannot access analytics (only raw record listing)
- JWT stored client-side (no refresh token for simplicity)
- MongoDB with Mongoose is used for flexibility and schema-driven modeling; can swap deployment target without changing application architecture

## Tradeoffs

- MongoDB chosen for document flexibility and easier horizontal scaling; it adds operational complexity compared to file-based databases
- No rate limiting implemented (noted as optional)
- No test suite included but service layer is isolated for easy unit testing

## Running Tests

### Setup

1. Create a `.env.test` file in the project root:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/finance-test
JWT_SECRET=test_jwt_secret_key_123
NODE_ENV=test
PORT=3001
```

IMPORTANT: Use a separate database name (`finance-test`, not your production DB). All data in this database will be wiped during test runs.

2. Make sure your MongoDB Atlas cluster allows your current IP address.

### Commands

```bash
npm install
npm test
npm run test:coverage
npm run test:watch
```

### How tests work

- Every test starts with a completely clean database
- Tests run serially (`--runInBand`) to avoid conflicts
- Tests use the Atlas URI from `.env.test` to catch real connection issues
- Run tests before every commit to catch regressions
- Coverage report is generated in the `/coverage` folder

## Render Recruiter Demo Setup

Use this setup so recruiters can open your API docs and test immediately, even with an empty MongoDB database.

### 1. Set Render Environment Variables

Add these variables in your Render service settings:

- MONGO_URI=<your_demo_mongodb_atlas_uri>
- JWT_SECRET=<strong_secret>
- JWT_EXPIRES_IN=7d
- NODE_ENV=production
- ENABLE_DEMO_SEED=true
- ENABLE_DEMO_RESET_ENDPOINT=true
- DEMO_ADMIN_EMAIL=admin@finance.com
- DEMO_ADMIN_PASSWORD=admin123
- DEMO_ANALYST_EMAIL=analyst@finance.com
- DEMO_ANALYST_PASSWORD=analyst123
- DEMO_VIEWER_EMAIL=viewer@finance.com
- DEMO_VIEWER_PASSWORD=viewer123

### 2. What Happens on Startup

- The API creates default admin if missing
- If no records exist and ENABLE_DEMO_SEED=true:
	- Demo admin, analyst, and viewer users are created
	- Sample income and expense records are inserted

### 3. Recruiter Testing Flow

1. Open Swagger docs at /api/docs
2. Call POST /api/auth/login with one of the demo accounts
3. Click Authorize in Swagger and paste: Bearer <token>
4. If you want a fresh data set, call POST /api/users/demo/seed as the admin account
5. Try protected endpoints like:
	 - GET /api/records
	 - GET /api/dashboard/summary
	 - GET /api/users (admin only)

### 4. Demo Safety Notes

- Use a dedicated demo MongoDB database, not production
- Use only fake/sample finance data
- Rotate demo passwords after interview cycles if needed

### Demo Seed Button

When ENABLE_DEMO_SEED=true, an admin can repopulate the demo Atlas database from Swagger with one click:

- POST /api/users/demo/seed

What seed does:

- Recreates the demo admin, analyst, and viewer users
- Inserts the sample finance records used for role testing
- Keeps the demo login values consistent for recruiters

Recommended usage:

- Call this after authorizing in Swagger with an admin Bearer token
- Use it on a dedicated demo database only

### 5. One-Click Demo Reset (Admin)

When ENABLE_DEMO_RESET_ENDPOINT=true, an admin can reset demo data from Swagger:

- POST /api/users/demo/reset

What reset does:

- Deletes all records in the connected demo database
- Removes configured demo users (admin/analyst/viewer emails)
- Recreates fresh demo users and sample records

Recommended usage:

- Enable this endpoint only in your dedicated demo environment
- Keep this disabled in production by leaving ENABLE_DEMO_RESET_ENDPOINT=false
