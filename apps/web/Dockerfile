# ==========================================
# 1. Base / Dependencies Stage
# ==========================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy root workspace configs
COPY package.json bun.lock* ./
COPY packages/config ./packages/config
COPY packages/domain ./packages/domain
COPY packages/validation ./packages/validation
COPY apps/web ./apps/web

# Install dependencies across monorepo
RUN bun install --frozen-lockfile

# ==========================================
# 2. Build Next.js Stage
# ==========================================
FROM base AS builder
WORKDIR /app/apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NODE_ENV=production

RUN bun run build

# ==========================================
# 3. Production Runner Stage
# ==========================================
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/package.json ./package.json

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["bun", "run", "start"]
