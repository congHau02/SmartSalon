package com.smartsalon.analytics.service;

import com.smartsalon.analytics.dto.InventoryAlertsAnalyticsResponse;

import java.time.LocalDate;

public interface InventoryAlertsAnalyticsService {
    InventoryAlertsAnalyticsResponse getInventoryAlertsReport(Long branchId, LocalDate startDate, LocalDate endDate);
}
