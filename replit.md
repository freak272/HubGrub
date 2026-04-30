# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (provisioned but not yet used — routes use in-memory store)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/api-server` — Express API server at `/api`
- `artifacts/web` — React + Vite web app at `/web/`
- `artifacts/mobile` — Expo (React Native) mobile app at `/`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Routes (in-memory store)

- `GET /api/products` — list products
- `POST /api/products` — add product
- `DELETE /api/products/:id` — remove product
- `GET /api/orders` — list orders
- `POST /api/orders` — create order
- `POST /api/orders/:id/advance` — advance order status
- `GET /api/stats` — dashboard statistics

## Notes

- The api-zod index.ts is patched by the codegen script to avoid type export conflicts. Do not revert `lib/api-spec/package.json`'s codegen script.
- In-memory store resets on server restart. Upgrade to PostgreSQL + Drizzle for persistence.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
