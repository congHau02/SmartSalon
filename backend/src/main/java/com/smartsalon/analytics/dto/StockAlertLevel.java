package com.smartsalon.analytics.dto;

public enum StockAlertLevel {
    OUT_OF_STOCK(1),
    LOW_STOCK(2),
    NEAR_THRESHOLD(3),
    HEALTHY(4);

    private final int priority;

    StockAlertLevel(int priority) {
        this.priority = priority;
    }

    public int getPriority() {
        return priority;
    }
}
