package com.smartsalon.pos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.catalog.entity.ServiceBomEntity;
import com.smartsalon.catalog.repository.ServiceBomRepository;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.pos.dto.ActualBomItemDto;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.TechnicalLogEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Component
public class OrderBomResolver {

    private final ServiceBomRepository serviceBomRepository;
    private final ObjectMapper objectMapper;

    public OrderBomResolver(ServiceBomRepository serviceBomRepository) {
        this(serviceBomRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public OrderBomResolver(
            ServiceBomRepository serviceBomRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.serviceBomRepository = serviceBomRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper().findAndRegisterModules();
    }

    public List<ActualBomItemDto> parseActualBomJson(String actualBomJson, Long orderId) {
        if (!StringUtils.hasText(actualBomJson)) {
            return List.of();
        }
        try {
            List<ActualBomItemDto> parsed = objectMapper.readValue(
                    actualBomJson,
                    new TypeReference<List<ActualBomItemDto>>() {}
            );
            return parsed != null ? parsed : List.of();
        } catch (Exception e) {
            log.warn("Failed to deserialize actual_bom_json for order {}: {}", orderId, e.getMessage());
            return List.of();
        }
    }

    public String serializeActualBomJson(List<ActualBomItemDto> items, Long orderId) {
        try {
            return objectMapper.writeValueAsString(items != null ? items : List.of());
        } catch (Exception e) {
            log.error("Failed to serialize bomItems for order {}: {}", orderId, e.getMessage());
            throw new IllegalStateException("Failed to serialize actual BOM JSON", e);
        }
    }

    public List<ActualBomItemDto> buildStandardBomItems(OrderEntity order) {
        Map<Long, ActualBomItemDto> bomMap = new LinkedHashMap<>();
        if (order == null || order.getItems() == null) {
            return new ArrayList<>();
        }

        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE || item.getService() == null) {
                continue;
            }
            Long serviceId = item.getService().getId();
            int qty = item.getQuantity();
            List<ServiceBomEntity> serviceBoms = serviceBomRepository.findAllByServiceIdAndIsDeletedFalse(serviceId);

            for (ServiceBomEntity bom : serviceBoms) {
                if (bom.getProduct() == null) continue;
                ProductEntity product = bom.getProduct();
                Long prodId = product.getId();
                BigDecimal itemAmount = bom.getStandardAmount() != null
                        ? bom.getStandardAmount().multiply(BigDecimal.valueOf(qty))
                        : BigDecimal.ZERO;

                if (bomMap.containsKey(prodId)) {
                    ActualBomItemDto existing = bomMap.get(prodId);
                    BigDecimal updatedStd = existing.getStandardAmount().add(itemAmount);
                    existing.setStandardAmount(updatedStd);
                    existing.setActualAmount(updatedStd);
                } else {
                    bomMap.put(prodId, ActualBomItemDto.builder()
                            .productId(prodId)
                            .productName(product.getName())
                            .productSku(product.getSku())
                            .standardAmount(itemAmount)
                            .actualAmount(itemAmount)
                            .unit(bom.getUnit() != null ? bom.getUnit() : "ml")
                            .build());
                }
            }
        }
        return new ArrayList<>(bomMap.values());
    }

    public Map<Long, BigDecimal> resolveEffectiveDeductionVolumes(OrderEntity order, Optional<TechnicalLogEntity> techLogOpt) {
        Map<Long, BigDecimal> result = new LinkedHashMap<>();
        if (techLogOpt != null && techLogOpt.isPresent() && StringUtils.hasText(techLogOpt.get().getActualBomJson())) {
            List<ActualBomItemDto> parsed = parseActualBomJson(techLogOpt.get().getActualBomJson(), order.getId());
            if (!parsed.isEmpty()) {
                for (ActualBomItemDto item : parsed) {
                    if (item.getProductId() != null && item.getActualAmount() != null && item.getActualAmount().compareTo(BigDecimal.ZERO) > 0) {
                        result.merge(item.getProductId(), item.getActualAmount(), BigDecimal::add);
                    }
                }
                return result;
            }
        }

        for (ActualBomItemDto std : buildStandardBomItems(order)) {
            if (std.getProductId() != null && std.getStandardAmount() != null && std.getStandardAmount().compareTo(BigDecimal.ZERO) > 0) {
                result.merge(std.getProductId(), std.getStandardAmount(), BigDecimal::add);
            }
        }
        return result;
    }

    public StandardBomAggregation aggregateStandardBomForOrders(Collection<OrderEntity> orders) {
        Map<Long, BigDecimal> standardBomVolumes = new HashMap<>();
        Map<Long, ProductEntity> consumableProducts = new HashMap<>();

        if (orders == null || orders.isEmpty()) {
            return new StandardBomAggregation(standardBomVolumes, consumableProducts);
        }

        Set<Long> serviceIds = new HashSet<>();
        for (OrderEntity order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItemEntity item : order.getItems()) {
                if (!item.isDeleted() && item.getItemType() == OrderItemType.SERVICE && item.getService() != null) {
                    serviceIds.add(item.getService().getId());
                }
            }
        }

        if (serviceIds.isEmpty()) {
            return new StandardBomAggregation(standardBomVolumes, consumableProducts);
        }

        Map<Long, List<ServiceBomEntity>> bomsByServiceId = new HashMap<>();
        List<ServiceBomEntity> allBoms = serviceBomRepository.findAllByServiceIdInAndIsDeletedFalse(serviceIds);
        for (ServiceBomEntity bom : allBoms) {
            if (bom.getService() != null) {
                bomsByServiceId.computeIfAbsent(bom.getService().getId(), k -> new ArrayList<>()).add(bom);
            }
        }

        for (OrderEntity order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItemEntity item : order.getItems()) {
                if (item.isDeleted() || item.getItemType() != OrderItemType.SERVICE || item.getService() == null) continue;
                List<ServiceBomEntity> boms = bomsByServiceId.getOrDefault(item.getService().getId(), Collections.emptyList());
                for (ServiceBomEntity bom : boms) {
                    if (bom.getProduct() != null && bom.getStandardAmount() != null) {
                        Long pId = bom.getProduct().getId();
                        BigDecimal standardVolume = bom.getStandardAmount().multiply(BigDecimal.valueOf(item.getQuantity()));
                        standardBomVolumes.merge(pId, standardVolume, BigDecimal::add);
                        consumableProducts.putIfAbsent(pId, bom.getProduct());
                    }
                }
            }
        }

        return new StandardBomAggregation(standardBomVolumes, consumableProducts);
    }

    public BigDecimal calculateStandardChemicalCogs(OrderEntity order) {
        if (order == null || order.getItems() == null) {
            return BigDecimal.ZERO;
        }
        StandardBomAggregation agg = aggregateStandardBomForOrders(List.of(order));
        BigDecimal sum = BigDecimal.ZERO;
        for (Map.Entry<Long, BigDecimal> entry : agg.standardVolumesByProductId().entrySet()) {
            ProductEntity product = agg.productsById().get(entry.getKey());
            if (product != null && product.hasMeasurableVolume()) {
                sum = sum.add(product.calculateVolumeCostAmount(entry.getValue()));
            }
        }
        return sum;
    }

    public static BigDecimal calculateStandardRetailCogs(OrderEntity order) {
        if (order == null || order.getItems() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (OrderItemEntity item : order.getItems()) {
            if (item.isDeleted() || item.getItemType() != OrderItemType.PRODUCT || item.getProduct() == null) continue;
            sum = sum.add(item.getProduct().calculateRetailCostAmount(item.getQuantity()));
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    public record StandardBomAggregation(
            Map<Long, BigDecimal> standardVolumesByProductId,
            Map<Long, ProductEntity> productsById
    ) {}
}
