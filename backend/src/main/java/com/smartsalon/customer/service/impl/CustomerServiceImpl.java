package com.smartsalon.customer.service.impl;

import com.smartsalon.customer.dto.CustomerLoyaltyDto;
import com.smartsalon.customer.service.CustomerService;
import com.smartsalon.user.entity.MembershipTier;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public CustomerLoyaltyDto getLoyaltyPreview(String phone) {
        if (phone == null || phone.isBlank()) {
            return defaultLoyaltyPreview(phone);
        }

        String cleanPhone = phone.trim();
        Optional<UserEntity> userOpt = userRepository.findByPhoneAndIsDeletedFalse(cleanPhone);
        if (userOpt.isEmpty()) {
            return defaultLoyaltyPreview(cleanPhone);
        }

        UserEntity user = userOpt.get();
        MembershipTier tier = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.STANDARD;
        BigDecimal spent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal credit = user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO;

        return CustomerLoyaltyDto.builder()
                .customerId(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .membershipTier(tier)
                .discountPercent(tier.getDiscountPercent())
                .totalSpent(spent)
                .nextTier(tier.getNextTier())
                .amountToNextTier(tier.getAmountToNextTier(spent))
                .creditBalance(credit)
                .isProvisional(user.isProvisional())
                .build();
    }

    private CustomerLoyaltyDto defaultLoyaltyPreview(String phone) {
        MembershipTier standard = MembershipTier.STANDARD;
        return CustomerLoyaltyDto.builder()
                .phone(phone)
                .membershipTier(standard)
                .discountPercent(standard.getDiscountPercent())
                .totalSpent(BigDecimal.ZERO)
                .nextTier(standard.getNextTier())
                .amountToNextTier(standard.getAmountToNextTier(BigDecimal.ZERO))
                .creditBalance(BigDecimal.ZERO)
                .isProvisional(true)
                .build();
    }
}
