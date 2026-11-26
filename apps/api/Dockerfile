FROM node:24-alpine AS build

WORKDIR /workspace
COPY . .
RUN npm ci
RUN npx prisma generate --schema=packages/domain/prisma/schema.prisma
RUN npm run build --workspace=@primehorizon/domain
RUN npm run build --workspace=api
RUN mkdir -p apps/api/assets

FROM node:24-alpine AS production-deps

WORKDIR /workspace
COPY . .
RUN npm ci --omit=dev --workspace=api --workspace=@primehorizon/domain
RUN npx prisma generate --schema=packages/domain/prisma/schema.prisma

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /workspace

COPY --from=production-deps /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/assets ./apps/api/assets
COPY --from=build /workspace/packages/domain ./packages/domain

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
