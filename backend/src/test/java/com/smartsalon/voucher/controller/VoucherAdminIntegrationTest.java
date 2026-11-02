package com.smartsalon.voucher.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.config.TestAuthConfig;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import com.smartsalon.voucher.dto.CreateVoucherRequest;
import com.smartsalon.voucher.dto.ToggleVoucherActiveRequest;
import com.smartsalon.voucher.dto.UpdateVoucherRequest;
import com.smartsalon.voucher.entity.VoucherEntity;
import com.smartsalon.voucher.entity.VoucherType;
import com.smartsalon.voucher.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestAuthConfig.class)
@Transactional
class VoucherAdminIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private BranchEntity branch1;
    private BranchEntity branch2;
    private UserEntity managerBranch1;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        branch1 = branchRepository.findById(1L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 1").address("Addr 1").phone("0901").isActive(true).build()));
        branch2 = branchRepository.findById(2L).orElseGet(() ->
                branchRepository.save(BranchEntity.builder().name("Branch 2").address("Addr 2").phone("0902").isActive(true).build()));

        RoleEntity managerRole = roleRepository.findByName("MANAGER").orElseGet(() ->
                roleRepository.save(RoleEntity.builder().name("MANAGER").description("Manager").build()));

        managerBranch1 = userRepository.findByUsernameAndIsDeletedFalse("mgr.voucher.b1").orElseGet(() ->
                userRepository.save(UserEntity.builder()
                        .username("mgr.voucher.b1")
                        .passwordHash("password")
                        .fullName("Manager Branch 1")
                        .phone("0987112233")
                        .branch(branch1)
                        .roles(Set.of(managerRole))
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Admin creates voucher successfully: code normalized to uppercase")
    void createVoucher_byAdmin_success() throws Exception {
        CreateVoucherRequest req = CreateVoucherRequest.builder()
                .code("summer2026")
                .name("Chương trình hè 2026")
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("15.00"))
                .maxDiscount(new BigDecimal("100000.00"))
                .minOrderAmount(new BigDecimal("300000.00"))
                .usageLimit(100)
                .perCustomerLimit(2)
                .branchIds(Set.of(branch1.getId()))
                .build();

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.code").value("SUMMER2026"))
                .andExpect(jsonPath("$.result.type").value("PERCENT"))
                .andExpect(jsonPath("$.result.value").value(15.00))
                .andExpect(jsonPath("$.result.maxDiscount").value(100000.00))
                .andExpect(jsonPath("$.result.chainWide").value(false))
                .andExpect(jsonPath("$.result.branchIds", hasItem(branch1.getId().intValue())));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Admin creating voucher with duplicate code fails with VOUCHER_ALREADY_EXISTS")
    void createVoucher_duplicateCode_fails() throws Exception {
        voucherRepository.save(VoucherEntity.builder()
                .code("DUP2026")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .build());

        CreateVoucherRequest req = CreateVoucherRequest.builder()
                .code("dup2026")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .build();

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCHER_ALREADY_EXISTS.getCode()));
    }

    @Test
    @WithMockUser(username = "mgr.voucher.b1", roles = {"MANAGER"})
    @DisplayName("Manager cannot create voucher: returns 403 Forbidden")
    void createVoucher_byManager_failsForbidden() throws Exception {
        CreateVoucherRequest req = CreateVoucherRequest.builder()
                .code("MGRCODE")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("20000.00"))
                .build();

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Admin updates voucher details and toggles active state")
    void updateAndToggleActive_byAdmin_success() throws Exception {
        VoucherEntity voucher = voucherRepository.save(VoucherEntity.builder()
                .code("UPDATE2026")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .active(true)
                .build());

        UpdateVoucherRequest updateReq = UpdateVoucherRequest.builder()
                .name("Updated Voucher")
                .type(VoucherType.PERCENT)
                .value(new BigDecimal("20.00"))
                .maxDiscount(new BigDecimal("70000.00"))
                .build();

        mockMvc.perform(put("/api/v1/admin/vouchers/" + voucher.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Updated Voucher"))
                .andExpect(jsonPath("$.result.type").value("PERCENT"))
                .andExpect(jsonPath("$.result.value").value(20.00));

        ToggleVoucherActiveRequest toggleReq = new ToggleVoucherActiveRequest(false);
        mockMvc.perform(patch("/api/v1/admin/vouchers/" + voucher.getId() + "/active")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toggleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.active").value(false));
    }

    @Test
    @WithMockUser(username = "mgr.voucher.b1", roles = {"MANAGER"})
    @DisplayName("Manager sees chain-wide vouchers and branch 1 vouchers, but not branch 2 specific vouchers")
    void getVouchers_byManager_scopedToBranch() throws Exception {
        VoucherEntity chainWide = voucherRepository.save(VoucherEntity.builder()
                .code("CHAINWIDE")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("30000.00"))
                .branches(Set.of())
                .build());

        VoucherEntity branch1Voucher = voucherRepository.save(VoucherEntity.builder()
                .code("BRANCH1V")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("40000.00"))
                .branches(Set.of(branch1))
                .build());

        VoucherEntity branch2Voucher = voucherRepository.save(VoucherEntity.builder()
                .code("BRANCH2V")
                .type(VoucherType.FIXED)
                .value(new BigDecimal("50000.00"))
                .branches(Set.of(branch2))
                .build());

        mockMvc.perform(get("/api/v1/admin/vouchers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[*].code", hasItems("CHAINWIDE", "BRANCH1V")))
                .andExpect(jsonPath("$.result[*].code", not(hasItem("BRANCH2V"))));
    }
}
