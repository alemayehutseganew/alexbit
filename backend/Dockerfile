FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/assets ./assets

EXPOSE 3001
CMD ["npm", "start"]
