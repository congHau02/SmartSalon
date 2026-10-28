package com.smartsalon.shift.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffRosterRowResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String role; // STYLIST, STAFF
    private String avatarUrl;
    private List<DailyScheduleCellResponse> schedules;
}
