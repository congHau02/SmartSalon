package com.smartsalon.analytics;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;

/** Supported analytical report kinds for export (URL slug + filename prefix). */
public enum ReportType {
    PNL("pnl", "Bao_Cao_PL_"),
    STAFF_PAYROLL("staff-payroll", "Bang_Luong_Hoa_Hong_");

    private final String slug;
    private final String filenamePrefix;

    ReportType(String slug, String filenamePrefix) {
        this.slug = slug;
        this.filenamePrefix = filenamePrefix;
    }

    public String slug() {
        return slug;
    }

    public String filenamePrefix() {
        return filenamePrefix;
    }

    public static ReportType parse(String value) {
        if (value != null) {
            String normalized = value.trim();
            for (ReportType type : values()) {
                if (type.slug.equalsIgnoreCase(normalized)) {
                    return type;
                }
            }
        }
        throw new AppException(ErrorCode.VALIDATION_ERROR);
    }
}
