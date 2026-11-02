# 01: GitHub Actions CI for Backend Tests and Frontend Tests + Build

**What to build:** Every push and pull request automatically runs the full backend test suite and the frontend test suite plus production build, so regressions in Phases 1-10 are caught before merge. CI needs no external services: backend tests already run on H2, so no MySQL or Redis containers are started. See the spec (`../spec.md`, "CI").

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A workflow triggers on `push` and `pull_request`.
- [x] Backend job: Temurin JDK 25, Maven dependency cache, `mvn -B verify` from the backend module; fails the run on any test failure.
- [x] Frontend job: Node LTS, npm cache, `npm ci`, `npm test`, `npm run build` from the frontend module. No lint step (the frontend has no `lint` script).
- [x] Both jobs run in parallel and pass green on the current main branch; any test that is red on a clean checkout is fixed or reported in `## Comments` rather than skipped silently.
- [x] README gets a one-line CI status note/badge.

## Comments

- Fixed `InventoryAlertsIntegrationTest.shouldReturnInventoryAlertsAndBomWastage`: The test seeded inventory transactions and order with an October date (`2026-10-15`) and queried `2026-10-01` to `2026-10-31`. Because `BaseEntity` and `InventoryTransactionEntity` use `@CreatedDate`, JPA Auditing overwrote `created_at` with `Instant.now()`, causing the test to fail once current execution entered November 2026. Added explicit native SQL update in `seedTestData()` matching the pattern in `AnalyticsControllerIntegrationTest` and `StaffPayrollIntegrationTest`.
- Fixed `PayOSWebhookIntegrationTest`: Prevented slot and schedule collisions across tests. `simulatePayment_Success` was moved to `tomorrow.atTime(11, 30)` and `handleWebhook_Success` to `tomorrow.atTime(8, 30)` on `plusDays(2)` so neither overlaps with each other, with `getPaymentInfo_Success` (14:00), nor with `RealtimeBookingNotificationIntegrationTest` (10:00). All slots remain strictly within stylist morning shift operating hours.
- Ran full backend test suite (`mvn -B verify`): 190/190 tests passed.
- Ran frontend test suite (`npm test`) & production build (`npm run build`): 14 test files, 100/100 tests passed, Vite build succeeded.
