package com.smartsalon.analytics.service;

import com.smartsalon.analytics.dto.PnlAnalyticsResponse;

import java.time.LocalDate;

public interface PnlAnalyticsService {

    PnlAnalyticsResponse getPnlReport(Long branchId, LocalDate startDate, LocalDate endDate);
}
