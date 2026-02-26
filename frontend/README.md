# Frontend (Bun + Vite + React + TypeScript + SWC)

This frontend is built with Bun, Vite, React, TypeScript, and SWC.

## Prerequisites

- Bun 1.3+

## Setup

```bash
cd frontend
bun install
```

## Development

```bash
bun run dev
```

Vite dev server runs on port `5173` by default and proxies API routes to FastAPI:

- `/api/*`
- `/v1/*`
- `/backend-api/*`
- `/health`


## Base path deployment

When serving the dashboard under a sub-path (for example `/keymgmnt/admin`), set:

```bash
VITE_PUBLIC_BASE_PATH=/keymgmnt/admin
```

This value configures both the Vite public base and React Router basename.

## Build

```bash
bun run build
```

Production assets are emitted to `../app/static`.

## Quality

```bash
bun run lint
bun run test
bun run test:coverage
```
