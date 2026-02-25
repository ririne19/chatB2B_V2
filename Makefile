# Chat B2B - Raccourcis Docker Compose

.PHONY: start stop restart logs migrate seed reset

# Démarrage / arrêt
start:
	docker compose up -d

stop:
	docker compose down

restart:
	docker compose restart

# Logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# Base de données (backend)
migrate:
	docker compose exec backend pnpm prisma:migrate -- --name $(or $(NAME),update)

seed:
	docker compose exec backend pnpm prisma:seed

# Reset complet : down -v, up, attendre les healthchecks, migrate + seed
reset: stop
	docker compose down -v
	docker compose up -d
	@echo "En attente des services (postgres, redis)..."
	@sleep 15
	docker compose exec backend pnpm prisma:generate
	docker compose exec backend pnpm prisma:migrate -- --name init
	docker compose exec backend pnpm prisma:seed
	@echo "Reset terminé. Backend: http://localhost:3001/health — Frontend: http://localhost:3002"
