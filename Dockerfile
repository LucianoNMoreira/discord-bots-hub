# Multi-stage Dockerfile optimized for Next.js with pnpm

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

# Install dependencies needed to compile native modules
# zlib-sync also needs zlib-dev
RUN apk add --no-cache python3 make g++ zlib-dev

RUN corepack enable && corepack prepare pnpm@9.12.1 --activate

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

# Install dependencies needed to compile native modules
RUN apk add --no-cache python3 make g++ zlib-dev

RUN corepack enable && corepack prepare pnpm@9.12.1 --activate

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Temporary environment variables for build
# (real values will be injected at runtime)
ENV AUTH_SECRET=build-time-secret-must-be-32chars-or-more
ENV AUTH_USERNAME=admin
ENV AUTH_PASSWORD=build-time-password

# Build Next.js application (force webpack instead of turbopack)
ENV NEXT_PRIVATE_TEST_BUILD_MODE=webpack
RUN pnpm exec next build --webpack

# ==========================================
# Stage 3: Runner (Production)
# ==========================================
FROM node:20-alpine AS runner

# Install runtime libraries needed for native modules
# su-exec is needed for the entrypoint to switch users
RUN apk add --no-cache zlib su-exec

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy complete node_modules to ensure native modules work
# Standalone doesn't copy native modules like zlib-sync correctly
COPY --from=builder /app/node_modules ./node_modules

# Create directories for persistent data
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public/uploads

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Entrypoint that adjusts permissions and then switches to nextjs user
ENTRYPOINT ["docker-entrypoint.sh"]

# Command to start the application
CMD ["node", "server.js"]
