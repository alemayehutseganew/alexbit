# PrimeHorizon Group

The project is maintained as two independent applications:

- `frontend/` — Next.js client application. Deploy this directory as the Vercel project root.
- `backend/` — NestJS API application with its own Prisma schema. Deploy this directory as the API project root.

The shared Zod schemas are copied into each app so they can be installed and built independently. The frontend defines the RFP status values locally to avoid depending on a generated backend Prisma client. The Prisma schema and migrations live in `backend/prisma`.

## Frontend

From `frontend/`:

```sh
npm install
npm run dev
```

The local server listens on `http://localhost:3000`. To make a production build, run `npm run build`; run it locally with `npm start`.

Set `NEXT_PUBLIC_API_URL` to the backend URL and configure the Auth.js/Keycloak environment variables in the deployment environment. The local `.env.local` is not committed.

## Backend

From `backend/`:

```sh
npm install
npm run start:dev
```

The API listens on port `3001` by default. `npm install` generates Prisma Client from `prisma/schema.prisma`. Run `npm run build` to compile the API and `npm start` to run the compiled application.

Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and any required Keycloak credentials in the deployment environment. The local `.env` is not committed.
