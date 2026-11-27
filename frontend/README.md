This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Local development

From the repository root, start the backend in one PowerShell terminal:

```powershell
Set-Location .\backend
npm ci
npm run dev
```

Start the frontend in a second terminal. The backend uses port `3000`, so the
frontend runs on `3001`:

```powershell
Set-Location .\frontend
npm ci
$env:NEXT_PUBLIC_API_URL = "http://localhost:3000"
$env:NEXTAUTH_URL = "http://localhost:3001"
npm run dev -- --port 3001
```

Configure `backend/.env` with a local PostgreSQL `DATABASE_URL` and a
`JWT_SECRET` of at least 32 characters. Keep `frontend/.env.local` configured
with a local NextAuth secret.

## Vercel environment variables

Set these for the Vercel deployment:

- `AUTH_SECRET` (preferred) or `NEXTAUTH_SECRET`; generate with `npx auth secret`.
- `NEXT_PUBLIC_API_URL`, set to the AletCloud API origin, without `/api`.
- `AUTH_KEYCLOAK_SHAREHOLDER_ID`, `AUTH_KEYCLOAK_SHAREHOLDER_SECRET`, and
  `AUTH_KEYCLOAK_SHAREHOLDER_ISSUER` for production shareholder sign-in.
- `AUTH_KEYCLOAK_CLIENT_ID`, `AUTH_KEYCLOAK_CLIENT_SECRET`, and
  `AUTH_KEYCLOAK_CLIENT_ISSUER` only if client Keycloak sign-in is enabled.

The Keycloak clients must allow the deployed callback URLs
`/api/auth/callback/keycloak-shareholder` and, when enabled,
`/api/auth/callback/keycloak-client`. Vercel supplies the request host; this
app sets `trustHost: true`, so `NEXTAUTH_URL` is not required for this setup.

The backend's `npx prisma db seed` command provisions only the shared superadmin
and shareholder accounts using private `BOOTSTRAP_*_PASSWORD` environment
secrets. To load the full fixture dataset, run `npm run seed:dev` from the
backend app root only against a disposable development database; it deletes
existing rows, refuses production, and requires `ALLOW_DESTRUCTIVE_SEED=true`
plus `SEED_SUPERADMIN_PASSWORD`, `SEED_CLIENT_PASSWORD`, and
`SEED_SHAREHOLDER_PASSWORD`.

Open [http://localhost:3001/en](http://localhost:3001/en). The API liveness
endpoint is [http://localhost:3000/health/live](http://localhost:3000/health/live).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
