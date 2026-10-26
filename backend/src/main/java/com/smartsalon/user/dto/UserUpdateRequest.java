package com.smartsalon.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String fullName;
    private String phone;
    private String email;
    private Long branchId;
    private List<String> roles;
    private Boolean isActive;
}
