# 0001 Monorepo Layout for Backend, Frontend, and Infrastructure

We chose a single monorepo layout containing `docker-compose.yml` at the repository root, `backend/` for the Spring Boot 4 / Java 25 service, and `frontend/` for the React 19 / Vite 8 client application.

## Context

SmartSalon requires tight synchronization between backend API contracts, WebSocket STOMP messaging topics, Flyway database migrations, and frontend UI components. Splitting these into separate repositories would add cross-repository PR overhead and version drift.

## Decision

The repository is structured as:
- Root `/`: Shared infrastructure (`docker-compose.yml` for MySQL 9.7 and Redis 8.4), documentation (`GLOSSARY.md`, `README.md`, `docs/`), and task tracking (`.scratch/`).
- `/backend`: Java 25 LTS, Spring Boot 4.1.x Maven application.
- `/frontend`: React 19, Vite 8, Tailwind CSS v4, React Router v7 application.

## Consequences

Developers can boot the entire stack with a single `docker compose up -d` at the root, run backend and frontend dev servers side-by-side, and ensure unified schema and API contract versioning.
