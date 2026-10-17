# Issue 03: Catalog Services, Category Filtering, BOM Formulations & Default Steps Backend

Status: ready-for-agent

## Description

Implement the Service Catalog module backend supporting:
1. Complete CRUD endpoints for Services under `/api/v1/services`.
2. Categorization and filtering by `category`, active status, and search terms.
3. Nested Bill of Materials (BOM) management linking services to chemical consumable products with standard amounts in ml or grams.
4. Default technical service steps configuration with template commission percentages for stylist payouts.

## Tasks

- [ ] Create JPA entities: `ServiceEntity`, `ServiceBomEntity`, `ServiceDefaultStepEntity` under `com.smartsalon.catalog.entity`.
- [ ] Create JPA repositories: `ServiceRepository`, `ServiceBomRepository`, `ServiceDefaultStepRepository`.
- [ ] Implement DTOs: `ServiceCreateRequest`, `ServiceUpdateRequest`, `ServiceResponse`, `ServiceBomDto`, `ServiceDefaultStepDto`.
- [ ] Implement `ServiceCatalogService` handling transactional persistence of services, BOM records, and default steps.
- [ ] Add business validation: non-negative prices, duration > 0, commission percentage sum <= 100%.
- [ ] Implement `ServiceCatalogController` exposing RESTful endpoints with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")` on mutating operations and public read access for booking catalog views.
- [ ] Add tests for service creation, BOM association, and step commission validation.

## Comments
