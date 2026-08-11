#!/bin/bash
###############################################################################
# UrutiX Backend — Docker Entrypoint
#
# Responsibilities:
#   1. Validate that all required environment variables are present.
#   2. Wait for PostgreSQL to accept connections.
#   3. Run SQL migrations (when AUTO_MIGRATE=true).
#   4. Hand off to the Node.js application via exec.
#
# Uses dumb-init as PID 1 so SIGTERM is forwarded cleanly to Node.
###############################################################################

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[ENTRYPOINT]${NC} $*"; }
log_success() { echo -e "${GREEN}[ENTRYPOINT]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[ENTRYPOINT]${NC} $*"; }
log_error()   { echo -e "${RED}[ENTRYPOINT]${NC} $*" >&2; }

# ── 1. Required-variable validation ──────────────────────────────────────────
validate_env() {
  local missing=0

  # Variables that MUST be set and non-empty in every environment.
  local required_vars=(
    DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME
    JWT_SECRET JWT_REFRESH_SECRET
  )

  # Additional variables required only in production.
  if [[ "${NODE_ENV:-production}" == "production" ]]; then
    required_vars+=(
      MOBILE_MONEY_WEBHOOK_SECRET
      ALLOWED_ORIGINS
      FRONTEND_URL
    )
  fi

  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      log_error "Required environment variable '$var' is not set."
      missing=1
    fi
  done

  if [[ $missing -eq 1 ]]; then
    log_error "Aborting: one or more required environment variables are missing."
    log_error "See .env.production.example for documentation."
    exit 1
  fi

  # Warn (but don't abort) if JWT secrets look too short.
  if [[ ${#JWT_SECRET} -lt 32 ]]; then
    log_warn "JWT_SECRET is shorter than 32 characters — use at least 64 for production."
  fi
  if [[ ${#JWT_REFRESH_SECRET} -lt 32 ]]; then
    log_warn "JWT_REFRESH_SECRET is shorter than 32 characters — use at least 64 for production."
  fi

  log_success "Environment validation passed."
}

# ── 2. Wait for PostgreSQL ────────────────────────────────────────────────────
wait_for_db() {
  log_info "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

  local max_attempts=30
  local attempt=0
  local wait_s=2

  until node -e "
    const { Client } = require('pg');
    const c = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000,
    });
    c.connect()
      .then(() => { c.end(); process.exit(0); })
      .catch(() => process.exit(1));
  " 2>/dev/null; do
    attempt=$(( attempt + 1 ))

    if (( attempt >= max_attempts )); then
      log_error "PostgreSQL did not become ready after $max_attempts attempts. Aborting."
      exit 1
    fi

    log_info "Not ready yet — attempt ${attempt}/${max_attempts}. Retrying in ${wait_s}s..."
    sleep "$wait_s"
  done

  log_success "PostgreSQL is ready."
}

# ── 3. Run migrations ─────────────────────────────────────────────────────────
run_migrations() {
  if [[ "${AUTO_MIGRATE:-true}" != "true" ]]; then
    log_info "AUTO_MIGRATE is disabled — skipping migrations."
    log_info "Run manually: docker compose exec backend node migrate.js"
    return
  fi

  log_info "Running migrations via migrate.js..."

  if node migrate.js; then
    log_success "Migrations completed successfully."
  else
    log_error "Migration runner exited with an error."
    log_info "Diagnose: docker compose exec backend node migrate.js doctor"
    log_info "Repair:   docker compose exec backend node migrate.js reconcile"

    if [[ "${FAIL_ON_MIGRATION_ERROR:-true}" == "true" ]]; then
      log_error "FAIL_ON_MIGRATION_ERROR=true — aborting startup."
      exit 1
    else
      log_warn "FAIL_ON_MIGRATION_ERROR=false — continuing despite migration failure."
    fi
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  log_info "========================================"
  log_info "  UrutiX Backend starting"
  log_info "  ENV  : ${NODE_ENV:-production}"
  log_info "  DB   : ${DB_NAME}@${DB_HOST}:${DB_PORT}"
  log_info "========================================"

  validate_env
  wait_for_db
  run_migrations

  # Always upsert enterprise permission catalog so Super Admin UI shows cargo/bidding/trips/etc.
  if [[ "${AUTO_SEED_PERMISSIONS:-true}" == "true" ]]; then
    log_info "Seeding / syncing permission catalog..."
    if node seed-permissions.js; then
      log_success "Permission catalog seeded."
    else
      log_warn "Permission seed failed (non-fatal) — run: docker compose exec backend node seed-permissions.js"
    fi
  else
    log_info "AUTO_SEED_PERMISSIONS=false — skipping permission catalog seed."
  fi

  log_success "Handing off to application: $*"
  exec "$@"
}

main "$@"
