package com.smartsalon.shift.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRosterRequest {
    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    @NotEmpty(message = "Danh sách ô lịch cần cập nhật không được để trống")
    @Valid
    private List<UpdateRosterCellRequest> cells;
}
