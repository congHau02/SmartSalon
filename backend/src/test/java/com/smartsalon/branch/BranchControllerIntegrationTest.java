package com.smartsalon.branch;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.config.TestAuthConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
class BranchControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BranchRepository branchRepository;

    private MockMvc mockMvc;
    private BranchEntity branch1;
    private BranchEntity branch2;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        List<BranchEntity> branches = branchRepository.findAllByIsDeletedFalseAndIsActiveTrue();
        if (branches.isEmpty()) {
            branch1 = branchRepository.save(BranchEntity.builder()
                    .name("SmartSalon Flagship - Quận 1")
                    .address("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                    .phone("0901234567")
                    .latitude(new BigDecimal("10.7745000"))
                    .longitude(new BigDecimal("106.7036000"))
                    .isActive(true)
                    .build());
        } else {
            branch1 = branches.get(0);
            branch1.setLatitude(new BigDecimal("10.7745000"));
            branch1.setLongitude(new BigDecimal("106.7036000"));
            branch1 = branchRepository.save(branch1);
        }

        if (branches.size() < 2) {
            branch2 = branchRepository.save(BranchEntity.builder()
                    .name("SmartSalon Luxury - Quận 3")
                    .address("456 Lê Văn Sỹ, Phường 12, Quận 3, TP. Hồ Chí Minh")
                    .phone("0909876543")
                    .latitude(new BigDecimal("10.7882000"))
                    .longitude(new BigDecimal("106.6789000"))
                    .isActive(true)
                    .build());
        } else {
            branch2 = branches.get(1);
            branch2.setLatitude(new BigDecimal("10.7882000"));
            branch2.setLongitude(new BigDecimal("106.6789000"));
            branch2 = branchRepository.save(branch2);
        }
    }

    @Test
    @DisplayName("GET /api/v1/branches trả về danh sách chi nhánh kèm tọa độ latitude và longitude")
    void getActiveBranches_returnsCoordinates() throws Exception {
        mockMvc.perform(get("/api/v1/branches")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.result[0].latitude").value(closeTo(10.7745, 0.001)))
                .andExpect(jsonPath("$.result[0].longitude").value(closeTo(106.7036, 0.001)))
                .andExpect(jsonPath("$.result[1].latitude").value(closeTo(10.7882, 0.001)))
                .andExpect(jsonPath("$.result[1].longitude").value(closeTo(106.6789, 0.001)));
    }

    @Test
    @DisplayName("GET /api/v1/branches/{id} trả về chi tiết chi nhánh kèm tọa độ")
    void getBranchById_returnsBranchWithCoordinates() throws Exception {
        mockMvc.perform(get("/api/v1/branches/" + branch1.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(branch1.getId().intValue()))
                .andExpect(jsonPath("$.result.latitude").value(closeTo(10.7745, 0.001)))
                .andExpect(jsonPath("$.result.longitude").value(closeTo(106.7036, 0.001)));
    }

    @Test
    @DisplayName("GET /api/v1/branches/{id} với ID không tồn tại trả về 404")
    void getBranchById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/branches/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
