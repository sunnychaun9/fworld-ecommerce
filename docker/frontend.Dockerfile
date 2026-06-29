# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# FWorld frontend (Next.js) — multi-stage production image using standalone output.
# Build context is the repository root: `docker build -f docker/frontend.Dockerfile .`
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Dependencies -------------------------------------------------------- #
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @fworld/frontend... --frozen-lockfile

# ---- Build --------------------------------------------------------------- #
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .
RUN pnpm --filter @fworld/frontend build

# ---- Runtime ------------------------------------------------------------- #
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=nextjs:nodejs /app/frontend/public ./frontend/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "frontend/server.js"]
