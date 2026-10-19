package com.smartsalon.analytics;

import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import org.springframework.http.MediaType;

/** Supported export file formats with their HTTP media types. */
public enum ReportFormat {
    XLSX("xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
    PDF("pdf", MediaType.APPLICATION_PDF);

    private final String extension;
    private final MediaType mediaType;

    ReportFormat(String extension, MediaType mediaType) {
        this.extension = extension;
        this.mediaType = mediaType;
    }

    public String extension() {
        return extension;
    }

    public MediaType mediaType() {
        return mediaType;
    }

    public static ReportFormat parse(String value) {
        if (value != null) {
            String normalized = value.trim();
            for (ReportFormat format : values()) {
                if (format.extension.equalsIgnoreCase(normalized)) {
                    return format;
                }
            }
        }
        throw new AppException(ErrorCode.VALIDATION_ERROR);
    }
}
