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
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Install dependencies across monorepo
RUN bun install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/packages/database
RUN bun run ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules and built code
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api ./apps/api
COPY --from=base /app/package.json ./package.json

# Create uploads directory for receipt files
RUN mkdir -p /app/apps/api/uploads

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["bun", "src/main.ts"]
