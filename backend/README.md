<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Shareholder management permissions

The shared `shareholder@primehorizon.com` login is provisioned with the
read-only `SHAREHOLDER` role by setting `BOOTSTRAP_SHAREHOLDER_PASSWORD`.
Shareholder administrators and managers retain the permission to manage
shareholder profiles and documents. Profile deletion removes its profile and
document records/files, but intentionally retains the tenant and user accounts.
Global company documents remain restricted to administrator roles.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

### AletCloud App Hosting

Set the app root directory to `backend` when the repository contains both the
frontend and backend. Configure:

```text
Build command: npm run build
Start command: npm start
```

`npm start` applies pending Prisma migrations before starting the API. Keep
`DATABASE_URL` set to the direct PostgreSQL connection URL so migrations can
run; `DATABASE_URL_POOLED` remains optional for runtime queries.
New shareholder KYC and company document uploads are stored in PostgreSQL so
they remain available across app redeployments. Existing local-file records
continue to use the legacy download path while those files remain on disk.

The package `postinstall` script runs `prisma generate`. AletCloud supplies
`PORT`; the API binds to that port on `0.0.0.0`. Do not replace it with a
fixed port or a localhost-only binding. AletCloud checks for a TCP listener,
not a particular health-check URL.

Set these environment variables in the AletCloud app settings:

- `DATABASE_URL`: direct PostgreSQL connection URL from the managed database;
  use this for Prisma schema migrations.
- `DATABASE_URL_POOLED`: optional pooled URL for runtime queries; when present,
  the Prisma service prefers it over `DATABASE_URL`.
- `JWT_SECRET`: a private random secret of at least 32 characters for API-issued
  tokens.
- `PORT`: use AletCloud's injected value; do not hardcode it.
- `FRONTEND_URL` or `CORS_ORIGINS`: optional frontend origin(s) if they are not
  already in the API CORS allowlist.
- `JWT_ISSUER` and `JWT_AUDIENCE`: optional; default to `primehorizon-api`.
- `AUTH_KEYCLOAK_CLIENT_ISSUER`, `AUTH_KEYCLOAK_SHAREHOLDER_ISSUER`, and
  `KEYCLOAK_API_AUDIENCE`: only when using the corresponding Keycloak flows.
- `OPENAI_API_KEY` and `CHAPA_SECRET_KEY`: only when enabling those integrations.

To provision accounts on the deployed database, temporarily add the desired
`BOOTSTRAP_*_PASSWORD` variables as private app environment secrets. Set only
the accounts you want to create or update; each password must be at least 12
characters. To set the shared read-only shareholder account's password, set
`BOOTSTRAP_SHAREHOLDER_PASSWORD`. This only updates that account. Run either
command from the backend app root with the intended database connection
configured:

```bash
npx prisma db seed
# Or: npm run provision:accounts
```

The command only creates or updates accounts whose password variables are set;
it does not wipe or modify other records. It hashes passwords before storing
them. Running it again resets selected accounts' passwords to the configured
values, so remove bootstrap secrets from app settings after it succeeds. Do not
commit passwords to the repository. Run it against the intended database, not
just during the build, so it only changes the intended environment.

`npx prisma db seed` is intentionally configured for this non-destructive
account provisioning. To load the full fixture dataset into a disposable local
database, run `npm run seed:dev` instead; it deletes existing rows, refuses
production, and requires `ALLOW_DESTRUCTIVE_SEED=true` and the three `SEED_*`
password variables.

Prisma connection attempts run in the background with logged exponential
retries, so database unavailability does not delay opening the API port.
`GET /health/live` checks process liveness; `GET /health` checks database
readiness and returns `503` while the database is unavailable.

In the AletCloud console, open the app's deployment and select its **Runtime**
or process log stream to see startup and `console.error` output. The **Build**
log stream only covers image/build steps. See AletCloud's
[app hosting](https://aletcloud.com/products/app-hosting) and
[deployment lifecycle](https://aletcloud.com/docs/how-deploys-work) guides.

When deploying from the repository root without a backend app-root setting,
prefix the commands with `cd backend &&`.

For general NestJS production guidance, see the [NestJS deployment
documentation](https://docs.nestjs.com/deployment).

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
