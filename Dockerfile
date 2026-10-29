# syntax=docker/dockerfile:1

# Base image with pnpm enabled (pnpm v10 — v11 has stricter build-script gating)
FROM node:25-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables at build time
# (NEXT_PUBLIC_* values are baked into the client bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_VERSION=dev

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Production image
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application (standalone output bundles only what is needed)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# License texts travel with the image (AGPL-3.0-or-later)
COPY --from=builder --chown=nextjs:nodejs /app/LICENSE /app/NOTICE ./

USER nextjs

EXPOSE 3004

ENV PORT=3004
ENV HOSTNAME="0.0.0.0"

# /api/health antwortet, sobald der Server laeuft (ohne API, ohne Rendern).
# 127.0.0.1 statt localhost: localhost zeigt im Container zuerst auf ::1,
# der Server lauscht aber nur auf IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q -T 3 -O /dev/null http://127.0.0.1:3004/api/health || exit 1

# SIGTERM (docker stop): Next.js nimmt keine neuen Verbindungen mehr an,
# laesst laufende Anfragen zu Ende laufen und beendet sich dann
# (next/dist/server/lib/start-server.js). Keine eigene Signalbehandlung noetig.
STOPSIGNAL SIGTERM
CMD ["node", "server.js"]
