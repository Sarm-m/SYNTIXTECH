WEB_ENV_FILE ?= .env
COMPOSE_ENV_ARGS := $(if $(wildcard $(WEB_ENV_FILE)),--env-file $(WEB_ENV_FILE),)
COMPOSE := docker compose $(COMPOSE_ENV_ARGS)
NPM ?= npm
NODE ?= $(shell if command -v node >/dev/null 2>&1; then echo node; elif command -v node.exe >/dev/null 2>&1; then echo node.exe; else echo node; fi)

APP_URL ?= http://localhost:3000
HEALTH_ATTEMPTS ?= 30
HEALTH_SLEEP ?= 2

PROJECT_CONTAINERS := drivectrl-mongodb drivectrl-backend drivectrl-frontend
PROJECT_NETWORK := drivecontrol-net

.DEFAULT_GOAL := help

.PHONY: help setup build up docker docker-up dev dev-check local-stop health logs ps down docker-down clean reset restart test lint backend-test frontend-test secrets-check docker-check

help:
	@echo "DriveControl commands"
	@echo ""
	@echo "  make build        Construye las imagenes Docker"
	@echo "  make up           Levanta Docker limpio en http://localhost:3000"
	@echo "  make down         Apaga Docker y procesos npm/vite locales"
	@echo "  make health       Valida Mongo y Google Auth"
	@echo ""
	@echo "  make dev          Desarrollo local con npm (alternativo)"
	@echo "  make setup        Instala dependencias backend/frontend"
	@echo "  make test         Ejecuta pruebas backend/frontend"
	@echo "  make logs         Sigue logs Docker"
	@echo "  make ps           Lista servicios Docker"
	@echo "  make reset        Borra contenedores y volumenes Docker del proyecto"

setup:
	$(NPM) run setup

build:
	$(COMPOSE) build

up:
	@echo "Apagando procesos npm/vite locales para evitar cruces con Docker..."
	@$(MAKE) --no-print-directory local-stop
	@docker network rm $(PROJECT_NETWORK) >/dev/null 2>&1 || true
	$(COMPOSE) up -d --remove-orphans
	@$(MAKE) health

docker docker-up: up

dev:
	@echo "Apagando Docker para evitar mezclar backend viejo con frontend npm..."
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	@$(MAKE) --no-print-directory local-stop
	@echo "Iniciando desarrollo local con npm..."
	$(NPM) run dev

dev-check:
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	$(NPM) run dev:check

local-stop:
	@if command -v $(NODE) >/dev/null 2>&1; then \
		$(NODE) scripts/stop-local-dev.mjs; \
	else \
		echo "[local-stop] Node no disponible; se omite cierre automatico de procesos npm/vite."; \
	fi

health:
	@echo "Frontend/API proxy: $(APP_URL)"
	@ok=0; \
	for attempt in $$(seq 1 $(HEALTH_ATTEMPTS)); do \
		if curl -fsS "$(APP_URL)/api/health/db" > /tmp/drivecontrol-db-health.json 2>/dev/null && \
		   curl -fsS "$(APP_URL)/api/health/auth" > /tmp/drivecontrol-auth-health.json 2>/dev/null; then \
			ok=1; \
			break; \
		fi; \
		sleep $(HEALTH_SLEEP); \
	done; \
	if [ "$$ok" = "1" ]; then \
		cat /tmp/drivecontrol-db-health.json; \
		echo ""; \
		cat /tmp/drivecontrol-auth-health.json; \
	else \
		echo "No se pudo validar $(APP_URL). Revisa make logs."; \
		exit 1; \
	fi
	@echo ""

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

down:
	@echo "Apagando Docker y procesos npm locales del proyecto..."
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	@docker network rm $(PROJECT_NETWORK) >/dev/null 2>&1 || true
	@$(MAKE) --no-print-directory local-stop

docker-down: down

clean:
	@echo "Limpiando contenedores y red Docker del proyecto..."
	@$(COMPOSE) down --remove-orphans || true
	@docker rm -f $(PROJECT_CONTAINERS) 2>/dev/null || true
	@docker network rm $(PROJECT_NETWORK) 2>/dev/null || true
	@echo "Limpieza Docker completada."

reset:
	@echo "ADVERTENCIA: esto elimina contenedores, red y volumenes del proyecto."
	@$(COMPOSE) down -v --remove-orphans || true
	@docker rm -f $(PROJECT_CONTAINERS) 2>/dev/null || true
	@docker network rm $(PROJECT_NETWORK) 2>/dev/null || true
	@echo "Reset completado. Se eliminaron datos locales de volumenes Docker del proyecto."

restart: down build up

docker-check:
	$(NPM) run docker:check

test:
	$(NPM) test

lint:
	$(NPM) run lint

backend-test:
	$(NPM) run backend:test

frontend-test:
	$(NPM) run frontend:test

secrets-check:
	$(NPM) run secrets:check
