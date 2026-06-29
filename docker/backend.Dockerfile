# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# FWorld backend (NestJS) — multi-stage production image.
# Build context is the repository root: `docker build -f docker/backend.Dockerfile .`
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Dependencies -------------------------------------------------------- #
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/package.json ./backend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @fworld/backend... --frozen-lockfile

# ---- Build --------------------------------------------------------------- #
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
RUN pnpm --filter @fworld/backend build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm --filter @fworld/backend deploy --prod /app/deploy

# ---- Runtime ------------------------------------------------------------- #
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=build --chown=nestjs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/backend/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/backend/prisma ./prisma
USER nestjs
EXPOSE 4000
CMD ["node", "dist/main.js"]
