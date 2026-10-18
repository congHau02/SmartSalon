package com.smartsalon.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicalLogResponse {

    private Long id;
    private Long orderId;
    private String orderCode;
    private Long customerId;
    private String customerName;
    private Long staffId;
    private String staffName;
    private String formulaNotes;
    private String hairConditionNotes;
    private String beforeImageUrl;
    private String afterImageUrl;

    @Builder.Default
    private List<ActualBomItemDto> bomItems = new ArrayList<>();

    @Builder.Default
    private Boolean isSaved = false;

    private Instant createdAt;
    private Instant updatedAt;
}
