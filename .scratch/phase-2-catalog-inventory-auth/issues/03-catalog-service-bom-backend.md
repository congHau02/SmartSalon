# Issue 03: Catalog Services, Category Filtering, BOM Formulations & Default Steps Backend

Status: resolved

## Description

Implement the Service Catalog module backend supporting:
1. Complete CRUD endpoints for Services under `/api/v1/services`.
2. Categorization and filtering by `category`, active status, and search terms.
3. Nested Bill of Materials (BOM) management linking services to chemical consumable products with standard amounts in ml or grams.
4. Default technical service steps configuration with template commission percentages for stylist payouts.

## Tasks

- [x] Create JPA entities: `ServiceEntity`, `ServiceBomEntity`, `ServiceDefaultStepEntity` under `com.smartsalon.catalog.entity`.
- [x] Create JPA repositories: `ServiceRepository`, `ServiceBomRepository`, `ServiceDefaultStepRepository`.
- [x] Implement DTOs: `ServiceCreateRequest`, `ServiceUpdateRequest`, `ServiceResponse`, `ServiceBomDto`, `ServiceDefaultStepDto`.
- [x] Implement `ServiceCatalogService` handling transactional persistence of services, BOM records, and default steps.
- [x] Add business validation: non-negative prices, duration > 0, commission percentage sum <= 100%.
- [x] Implement `ServiceCatalogController` exposing RESTful endpoints with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")` on mutating operations and public read access for booking catalog views.
- [x] Add tests for service creation, BOM association, and step commission validation.

## Comments

- Implemented `ServiceEntity`, `ServiceBomEntity`, `ServiceDefaultStepEntity`, and `ProductEntity`.
- Implemented `ServiceCatalogService` supporting cascading persistence for BOM recipes and technical step commission breakdown.
- Validated business rules: commission rate sum <= 100% (returning `INVALID_COMMISSION_RATES` 2003 on violation), duration >= 1 min, non-negative pricing.
- Configured public read endpoints `GET /api/v1/services/**` and secured mutating endpoints (`POST`, `PUT`, `DELETE`) with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`.
- Added `ServiceCatalogIntegrationTest` verifying all scenarios (public catalog browsing, admin CRUD with nested BOM, validation limits, RBAC 403 enforcement, soft delete).
- Verified test suite: 24/24 tests pass.
