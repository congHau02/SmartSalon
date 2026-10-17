# Issue 09: End-to-End Verification, Backend Tests, Frontend Build & Realistic Flow Demonstration

Status: ready-for-agent

## Description

Perform comprehensive end-to-end integration testing and verification of Phase 2 deliverables:
1. Run backend automated unit and slice tests for Auth, Catalog, and Inventory.
2. Verify Flyway migrations apply cleanly against MySQL without errors.
3. Verify Redis stores and rotates refresh tokens properly.
4. Execute frontend build (`npm run build`) ensuring zero compiler errors or missing assets.
5. Perform an end-to-end smoke test through the UI:
   - Log in as Super Admin (`admin` / `Admin@123`).
   - Switch branch context.
   - Inspect and create a new Service with BOM and Default Steps.
   - Create a Master Product and perform a Stock In for the active branch.
   - Trigger a simulated BOM chemical consumption and verify the dual-level auto-unseal engine accurately decrements sealed units and replenishes in-use volume.
   - Log out and verify Redis token revocation.

## Tasks

- [ ] Execute `mvn test` in `backend/` ensuring all controller, service, and algorithm tests pass.
- [ ] Run `npm run build` in `frontend/` ensuring production bundle builds successfully.
- [ ] Document curl requests and response envelopes for key Phase 2 endpoints in issue comments.
- [ ] Verify that all components comply with `ui-ux-pro-max` guidelines and accessibility standards.

## Comments
