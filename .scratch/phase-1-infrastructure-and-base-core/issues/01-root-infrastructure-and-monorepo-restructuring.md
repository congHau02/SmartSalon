# 01: Root Infrastructure & Monorepo Restructuring

**What to build:** A unified monorepo root environment where developers can start all supporting containerized infrastructure (MySQL 9.7 and Redis 8.4) with a single command from the project root, and where codebases are cleanly organized into `backend/` and `frontend/` folders.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Move `docker-compose.yml` from `SmartSalon/docker-compose.yml` to the root folder `./docker-compose.yml`.
- [x] Rename/move `SmartSalon/` directory to `./backend`.
- [x] Ensure `docker-compose.yml` runs `mysql:9.7` with database `smart_salon_db`, user `salon_user`, password `salon_password_2026`, character set `utf8mb4`, and healthcheck on port 3306.
- [x] Ensure `docker-compose.yml` runs `redis:8.4-alpine` with healthcheck on port 6379.
- [x] Validate configuration via `docker compose config`.

## Answer

- Root `docker-compose.yml` created with `mysql:9.7` and `redis:8.4-alpine` healthchecks, utf8mb4 collation, credentials matching `application.yml`, and volume mappings.
- Successfully verified via `docker compose config`.
- Moved and renamed `SmartSalon/` to `./backend`.
- Created comprehensive root `.gitignore` covering Java/Maven and Node/React artifacts.
