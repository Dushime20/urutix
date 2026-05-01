# ================================
# Multi-stage Dockerfile for NestJS Backend
# ================================

# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# ================================
# Stage 2: Production Stage
# ================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    dumb-init \
    bash

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy migrations and necessary files
COPY --from=builder --chown=nestjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nestjs:nodejs /app/data-source.js ./data-source.js
COPY --from=builder --chown=nestjs:nodejs /app/scripts/migrate.sh ./scripts/migrate.sh

# Copy entrypoint script from source (not from builder)
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

# Make scripts executable
RUN chmod +x ./scripts/migrate.sh ./docker-entrypoint.sh

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/documents && \
    chown -R nestjs:nodejs /app/uploads

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3005/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Start the application
CMD ["node", "dist/main.js"]
