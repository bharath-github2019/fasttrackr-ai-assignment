# Household Financial Intelligence Platform

A full-stack take-home solution for financial advisors to ingest variable Excel and client conversation audio, maintain household-level financial data, and view insights in a frontend dashboard.

## Tech Stack

- Frontend: React + TypeScript + Vite + Recharts
- Backend: Node.js + Express + TypeScript
- Data Storage (current runtime): Local JSON file store at `backend/data/households.json`
- ORM/Relational model (planned scaffold): Prisma + SQLite schema included in `backend/prisma/schema.prisma`
- AI: OpenAI Whisper (transcription) + OpenAI Responses API for structured enrichment extraction

## Features Implemented

- Excel ingestion endpoint with variable column matching and multi-sheet support
- Audio ingestion endpoint that enriches existing household records
- Household/member/account/bank/insight persistence via local JSON store
- Household list page with quick portfolio summary cards
- Household detail page showing members, accounts, and audio enrichment history
- Insights page with meaningful charts:
  - Income vs expenses floor
  - Net worth vs liquid net worth
  - Account type distribution
  - Members per household

## Assumptions

- Audio uploads are always associated with an existing household (`/api/ingest/audio/:householdId`).
- Excel may contain mixed household/member/account fields in each row; parser attempts best-effort mapping using alias matching.
- Sensitive account fields are masked before storage where available.
- If `OPENAI_API_KEY` is missing, audio endpoint still succeeds with fallback notes and low-confidence output.

## Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs at `http://localhost:4000`.

Current backend persistence is file-based (`backend/data/households.json`), so Prisma generation is not required for runtime.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` to backend.

## API Endpoints

- `POST /api/ingest/excel` (multipart form with `excel` file)
- `POST /api/ingest/audio/:householdId` (multipart form with `audio` file)
- `GET /api/households`
- `GET /api/households/:id`
- `GET /api/households/insights/summary`

## Approach Summary

1. Parse Excel across sheets into normalized household payloads using column alias heuristics.
2. Upsert household-level core fields, then merge and deduplicate members/accounts/banks.
3. Transcribe audio and extract structured updates using AI.
4. Apply enrichment to existing household and snapshot AI summary.
5. Visualize portfolio and planning indicators in a responsive advisor UI.

## Prisma Note

- Prisma schema and dependencies are present from the original relational design.
- In this environment, runtime has been switched to JSON storage to avoid Prisma engine download/network certificate issues.
- If network/certificate constraints are resolved, Prisma can be reinstated as the active data layer.
