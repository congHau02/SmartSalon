package com.smartsalon.voucher.repository;

import com.smartsalon.voucher.entity.VoucherRedemptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRedemptionRepository extends JpaRepository<VoucherRedemptionEntity, Long> {

    long countByVoucherIdAndCustomerId(Long voucherId, Long customerId);

    boolean existsByOrderId(Long orderId);

    Optional<VoucherRedemptionEntity> findByOrderId(Long orderId);
}
