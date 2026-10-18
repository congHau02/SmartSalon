package com.smartsalon.pos.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveTechnicalLogRequest {

    private Long staffId;

    private String formulaNotes;

    private String hairConditionNotes;

    private String beforeImageUrl;

    private String afterImageUrl;

    @Valid
    @Builder.Default
    private List<ActualBomItemDto> bomItems = new ArrayList<>();
}
