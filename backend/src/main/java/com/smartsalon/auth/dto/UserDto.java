package com.smartsalon.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private String phone;
    private String email;
    private String avatarUrl;
    private Long branchId;
    private String branchName;
    private List<String> roles;
}
