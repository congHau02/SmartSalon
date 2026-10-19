package com.smartsalon.analytics;

import java.time.LocalDate;

/**
 * Normalized reporting window shared by all analytics services.
 * Defaults to month-to-date and swaps reversed bounds.
 */
public record AnalyticsPeriod(LocalDate start, LocalDate end) {

    public static AnalyticsPeriod of(LocalDate startDate, LocalDate endDate) {
        LocalDate actualStart = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate actualEnd = (endDate != null) ? endDate : LocalDate.now();
        return actualStart.isAfter(actualEnd)
                ? new AnalyticsPeriod(actualEnd, actualStart)
                : new AnalyticsPeriod(actualStart, actualEnd);
    }
}
