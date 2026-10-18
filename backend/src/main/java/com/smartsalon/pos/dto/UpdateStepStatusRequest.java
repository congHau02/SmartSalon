package com.smartsalon.pos.dto;

import com.smartsalon.pos.entity.StepAssignmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStepStatusRequest {

    @NotNull(message = "Trạng thái bước không được để trống")
    private StepAssignmentStatus status;
}
