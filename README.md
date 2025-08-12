# Metallic Weight & Challan Generation

This project provides a LAN-friendly web app to manage master data, generate and print basket labels, and create formal delivery challans saved as PDFs to the `Challans/` folder.

## Stack
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Migrations: Plain SQL files with a lightweight Node runner
- Frontend: React + Vite + TypeScript

## Requirements
- Node 18+
- PostgreSQL 14+

## Setup
1. Create a Postgres database and user.
2. Copy `server/.env.example` to `server/.env` and set values.
3. Install deps and run migrations:

```bash
cd server
npm install
npm run migrate
npm run dev
```

4. In another terminal, start the client:

```bash
cd client
npm install
npm run dev
```

The backend listens on `http://localhost:4000` by default. The client on `http://localhost:5173`.

## PDF Output
Challans are saved to `<project_root>/Challans/{YYYY}/{MM}/CH-YY-XXXXXX.pdf` and served statically by the backend for browser download/printing.

## Notes
- Tare and Net weights are auto-calculated and read-only.
- Sequencing is maintained in the `sequencing` table (row key `challan_no`).
- Master updates for Bob/Box weights do not change historical challan item weights.
- Deletes are soft with a reason.
