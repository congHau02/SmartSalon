package com.smartsalon.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeEventDto {
    private String eventType;
    private Long branchId;
    private Long referenceId;
    private String code;
    private String title;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, Object> data;
}
