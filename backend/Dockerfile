###############################################################################
# UrutiX Backend — Multi-stage Dockerfile
#
# Stages:
#   deps       — install production + dev deps (cached layer)
#   builder    — compile TypeScript → dist/
#   production — minimal runtime image (no source, no dev deps)
###############################################################################

# ── Pinned base images ────────────────────────────────────────────────────────
ARG NODE_VERSION=20-alpine3.19

# ── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

# Build-time native deps (canvas, sharp, etc.)
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

COPY package*.json ./
# ci installs exactly what package-lock.json specifies — reproducible builds
RUN npm ci --ignore-scripts=false

# ── Stage 2: Build TypeScript ─────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Bring in node_modules (with dev deps for tsc)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Prune dev dependencies so only production modules go to the final image
RUN npm prune --production

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:${NODE_VERSION} AS production

# Runtime native libs only
RUN apk add --no-cache \
    cairo jpeg pango giflib \
    dumb-init bash \
    # curl for optional ad-hoc health checks inside the container
    curl \
  && rm -rf /var/cache/apk/*

# Non-root user — principle of least privilege
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nestjs -u 1001 -G nodejs

WORKDIR /app

# ── Copy artefacts from builder ───────────────────────────────────────────────
COPY --from=builder --chown=nestjs:nodejs /app/dist            ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules    ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/migrations      ./migrations
COPY --from=builder --chown=nestjs:nodejs /app/package.json    ./package.json

# Migration runner and seed scripts
COPY --chown=nestjs:nodejs migrate.js              ./migrate.js
COPY --chown=nestjs:nodejs mark-migrations-done.js ./mark-migrations-done.js
COPY --chown=nestjs:nodejs seed-admin.js           ./seed-admin.js
COPY --chown=nestjs:nodejs seed-permissions.js     ./seed-permissions.js
COPY --chown=nestjs:nodejs seed-contact-settings.js ./seed-contact-settings.js

# Entrypoint
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Uploads directory (persisted via Docker volume in compose)
RUN mkdir -p /app/uploads/documents \
 && chown -R nestjs:nodejs /app/uploads

# Logs directory (persisted via Docker volume in compose)
RUN mkdir -p /app/logs \
 && chown -R nestjs:nodejs /app/logs

USER nestjs

EXPOSE 3005

# dumb-init as PID 1 → forwards signals to Node, reaps zombies
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]

# ── Healthcheck ───────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/api/health',(r)=>{process.exit(r.statusCode===200?0:1)})"
