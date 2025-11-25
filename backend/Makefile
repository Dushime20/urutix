# Makefile for UrutiX SmartCargo Backend
# Usage: make <target>

.PHONY: help build up down restart logs clean deploy backup restore migrate

# Default target
help:
	@echo "UrutiX SmartCargo Backend - Makefile Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make build       - Build Docker images"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs (all services)"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-nginx  - View nginx logs"
	@echo "  make logs-db     - View database logs"
	@echo "  make clean       - Remove containers and volumes"
	@echo "  make deploy      - Deploy to production"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database (usage: make restore FILE=backup.sql)"
	@echo "  make migrate     - Run database migrations"
	@echo "  make shell       - Open shell in backend container"
	@echo "  make health      - Check service health"
	@echo "  make ps          - Show running containers"

# Build Docker images
build:
	docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
up:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Services started. Use 'make logs' to view logs."

# Stop services
down:
	docker-compose -f docker-compose.prod.yml down

# Restart services
restart:
	docker-compose -f docker-compose.prod.yml restart

# View logs
logs:
	docker-compose -f docker-compose.prod.yml logs -f

logs-backend:
	docker-compose -f docker-compose.prod.yml logs -f backend

logs-nginx:
	docker-compose -f docker-compose.prod.yml logs -f nginx

logs-db:
	docker-compose -f docker-compose.prod.yml logs -f postgres

# Clean up
clean:
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f

# Deploy
deploy:
	@if [ -f "./deploy.sh" ]; then \
		./deploy.sh production; \
	else \
		echo "Deploy script not found. Running manual deployment..."; \
		make build && make up && make migrate; \
	fi

# Backup database
backup:
	@mkdir -p backups
	@docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres urutix > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

# Restore database
restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE variable is required. Usage: make restore FILE=backup.sql"; \
		exit 1; \
	fi
	@docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres urutix < $(FILE)
	@echo "Database restored from $(FILE)"

# Run migrations
migrate:
	docker-compose -f docker-compose.prod.yml exec backend npm run migration:run:linux

# Open shell in backend
shell:
	docker-compose -f docker-compose.prod.yml exec backend sh

# Check health
health:
	@echo "Checking service health..."
	@docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "Testing endpoints..."
	@curl -s http://localhost/api/health | head -20 || echo "Backend health check failed"
	@echo ""

# Show running containers
ps:
	docker-compose -f docker-compose.prod.yml ps

