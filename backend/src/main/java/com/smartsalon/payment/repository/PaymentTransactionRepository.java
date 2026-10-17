package com.smartsalon.payment.repository;

import com.smartsalon.payment.entity.PaymentTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    Optional<PaymentTransactionEntity> findByTransactionCode(String transactionCode);

    List<PaymentTransactionEntity> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    Optional<PaymentTransactionEntity> findFirstByBookingIdAndStatus(Long bookingId, String status);
}
