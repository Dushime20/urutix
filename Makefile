# UrutiX Smart Logistics - Docker Management Makefile

.PHONY: help dev prod build up down logs clean restart migrate seed backup restore

# Default target
help:
	@echo "UrutiX Smart Logistics - Docker Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev              - Start development environment with hot reload"
	@echo "  make dev-build        - Build and start development environment"
	@echo "  make dev-down         - Stop development environment"
	@echo "  make dev-logs         - View development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod             - Start production environment"
	@echo "  make prod-build       - Build and start production environment"
	@echo "  make prod-down        - Stop production environment"
	@echo "  make prod-logs        - View production logs"
	@echo "  make prod-nginx       - Start production with Nginx reverse proxy"
	@echo ""
	@echo "Database Commands:"
	@echo "  make migrate          - Run database migrations"
	@echo "  make seed             - Seed database with initial data"
	@echo "  make db-backup        - Backup database"
	@echo "  make db-restore       - Restore database from backup"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make logs             - View all container logs"
	@echo "  make ps               - List running containers"
	@echo "  make restart          - Restart all services"
	@echo "  make clean            - Remove all containers, volumes, and images"
	@echo "  make prune            - Clean up Docker system"

# ================================
# Development Commands
# ================================

dev:
	docker-compose -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
	docker-compose -f docker-compose.dev.yml restart

# ================================
# Production Commands
# ================================

prod:
	docker-compose -f docker-compose.production.yml up -d

prod-build:
	docker-compose -f docker-compose.production.yml up -d --build

prod-down:
	docker-compose -f docker-compose.production.yml down

prod-logs:
	docker-compose -f docker-compose.production.yml logs -f

prod-restart:
	docker-compose -f docker-compose.production.yml restart

prod-nginx:
	docker-compose -f docker-compose.production.yml --profile with-nginx up -d

# ================================
# Database Commands
# ================================

migrate:
	docker-compose -f docker-compose.production.yml exec backend npm run migration:run

migrate-dev:
	docker-compose -f docker-compose.dev.yml exec backend npm run migration:run

seed:
	docker-compose -f docker-compose.production.yml exec backend npm run seed:all

seed-dev:
	docker-compose -f docker-compose.dev.yml exec backend npm run seed:all

db-backup:
	@echo "Creating database backup..."
	@mkdir -p ./backups
	docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U postgres urutix > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in ./backups/"

db-restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file path: " backup_file; \
	docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres urutix < $$backup_file
	@echo "Database restored successfully"

db-shell:
	docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix

db-shell-dev:
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix

# ================================
# Utility Commands
# ================================

logs:
	docker-compose -f docker-compose.production.yml logs -f

ps:
	docker-compose -f docker-compose.production.yml ps

restart:
	docker-compose -f docker-compose.production.yml restart

clean:
	@echo "WARNING: This will remove all containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.production.yml down -v --rmi all; \
		docker-compose -f docker-compose.dev.yml down -v --rmi all; \
		echo "Cleanup complete"; \
	fi

prune:
	docker system prune -af --volumes

# ================================
# Build Commands
# ================================

build-backend:
	docker build -t urutix-backend:latest -f backend/Dockerfile backend/

build-frontend:
	docker build -t urutix-frontend:latest -f frontend/Dockerfile frontend/

build-all: build-backend build-frontend

# ================================
# Monitoring Commands
# ================================

stats:
	docker stats

inspect-backend:
	docker-compose -f docker-compose.production.yml exec backend sh

inspect-frontend:
	docker-compose -f docker-compose.production.yml exec frontend sh

inspect-db:
	docker-compose -f docker-compose.production.yml exec postgres sh
