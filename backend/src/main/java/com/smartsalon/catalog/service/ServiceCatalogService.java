package com.smartsalon.catalog.service;

import com.smartsalon.catalog.dto.*;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ServiceResponse> getServices(String category, Boolean activeOnly) {
        List<ServiceEntity> services;
        boolean filterActive = Boolean.TRUE.equals(activeOnly);

        if (category != null && !category.isBlank()) {
            services = filterActive
                    ? serviceRepository.findAllByCategoryAndIsDeletedFalseAndIsActiveTrue(category.trim())
                    : serviceRepository.findAllByCategoryAndIsDeletedFalse(category.trim());
        } else {
            services = filterActive
                    ? serviceRepository.findAllByIsDeletedFalseAndIsActiveTrue()
                    : serviceRepository.findAllByIsDeletedFalse();
        }

        return services.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Long id) {
        ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        return mapToResponse(service);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return serviceRepository.findDistinctCategories();
    }

    @Transactional
    public ServiceResponse createService(ServiceCreateRequest request) {
        validateCommissionRates(request.getDefaultSteps());

        ServiceEntity service = ServiceEntity.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(request.getCategory().trim())
                .basePrice(request.getBasePrice())
                .durationMinutes(request.getDurationMinutes())
                .commissionPoolRate(request.getCommissionPoolRate() != null
                        ? request.getCommissionPoolRate()
                        : new java.math.BigDecimal("20.00"))
                .isActive(request.isActive())
                .bomList(new ArrayList<>())
                .defaultSteps(new ArrayList<>())
                .build();

        if (request.getBomList() != null) {
            for (ServiceBomDto bomDto : request.getBomList()) {
                ProductEntity product = productRepository.findByIdAndIsDeletedFalse(bomDto.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                ServiceBomEntity bom = ServiceBomEntity.builder()
                        .service(service)
                        .product(product)
                        .standardAmount(bomDto.getStandardAmount())
                        .unit(bomDto.getUnit() != null ? bomDto.getUnit() : product.getVolumeUnit())
                        .build();

                service.getBomList().add(bom);
            }
        }

        if (request.getDefaultSteps() != null) {
            int order = 1;
            for (ServiceDefaultStepDto stepDto : request.getDefaultSteps()) {
                ServiceDefaultStepEntity step = ServiceDefaultStepEntity.builder()
                        .service(service)
                        .stepName(stepDto.getStepName().trim())
                        .stepOrder(stepDto.getStepOrder() != null && stepDto.getStepOrder() > 0 ? stepDto.getStepOrder() : order++)
                        .commissionRate(stepDto.getCommissionRate())
                        .build();

                service.getDefaultSteps().add(step);
            }
        }

        service = serviceRepository.save(service);
        return mapToResponse(service);
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceUpdateRequest request) {
        ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));

        validateCommissionRates(request.getDefaultSteps());

        service.setName(request.getName().trim());
        service.setDescription(request.getDescription());
        service.setCategory(request.getCategory().trim());
        service.setBasePrice(request.getBasePrice());
        service.setDurationMinutes(request.getDurationMinutes());
        if (request.getCommissionPoolRate() != null) {
            service.setCommissionPoolRate(request.getCommissionPoolRate());
        }
        service.setActive(request.isActive());

        // Update BOM
        service.getBomList().clear();
        if (request.getBomList() != null) {
            for (ServiceBomDto bomDto : request.getBomList()) {
                ProductEntity product = productRepository.findByIdAndIsDeletedFalse(bomDto.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                ServiceBomEntity bom = ServiceBomEntity.builder()
                        .service(service)
                        .product(product)
                        .standardAmount(bomDto.getStandardAmount())
                        .unit(bomDto.getUnit() != null ? bomDto.getUnit() : product.getVolumeUnit())
                        .build();

                service.getBomList().add(bom);
            }
        }

        // Update Default Steps
        service.getDefaultSteps().clear();
        if (request.getDefaultSteps() != null) {
            int order = 1;
            for (ServiceDefaultStepDto stepDto : request.getDefaultSteps()) {
                ServiceDefaultStepEntity step = ServiceDefaultStepEntity.builder()
                        .service(service)
                        .stepName(stepDto.getStepName().trim())
                        .stepOrder(stepDto.getStepOrder() != null && stepDto.getStepOrder() > 0 ? stepDto.getStepOrder() : order++)
                        .commissionRate(stepDto.getCommissionRate())
                        .build();

                service.getDefaultSteps().add(step);
            }
        }

        service = serviceRepository.save(service);
        return mapToResponse(service);
    }

    @Transactional
    public void deleteService(Long id) {
        ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        service.setDeleted(true);
        serviceRepository.save(service);
    }

    private void validateCommissionRates(List<ServiceDefaultStepDto> steps) {
        if (steps == null || steps.isEmpty()) {
            return;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (ServiceDefaultStepDto step : steps) {
            if (step.getCommissionRate() != null) {
                total = total.add(step.getCommissionRate());
            }
        }
        if (total.compareTo(new BigDecimal("100.00")) > 0) {
            throw new AppException(ErrorCode.INVALID_COMMISSION_RATES);
        }
    }

    private ServiceResponse mapToResponse(ServiceEntity service) {
        List<ServiceBomDto> bomDtos = service.getBomList().stream()
                .filter(bom -> !bom.isDeleted())
                .map(bom -> ServiceBomDto.builder()
                        .id(bom.getId())
                        .productId(bom.getProduct().getId())
                        .productName(bom.getProduct().getName())
                        .productSku(bom.getProduct().getSku())
                        .standardAmount(bom.getStandardAmount())
                        .unit(bom.getUnit())
                        .build())
                .toList();

        List<ServiceDefaultStepDto> stepDtos = service.getDefaultSteps().stream()
                .map(step -> ServiceDefaultStepDto.builder()
                        .id(step.getId())
                        .stepName(step.getStepName())
                        .stepOrder(step.getStepOrder())
                        .commissionRate(step.getCommissionRate())
                        .build())
                .toList();

        return ServiceResponse.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .category(service.getCategory())
                .basePrice(service.getBasePrice())
                .commissionPoolRate(service.getCommissionPoolRate())
                .durationMinutes(service.getDurationMinutes())
                .isActive(service.isActive())
                .bomList(bomDtos)
                .defaultSteps(stepDtos)
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }
}
