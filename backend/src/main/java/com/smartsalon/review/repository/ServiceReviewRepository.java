package com.smartsalon.review.repository;

import com.smartsalon.review.entity.ServiceReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceReviewRepository extends JpaRepository<ServiceReviewEntity, Long> {

    Optional<ServiceReviewEntity> findByOrderIdAndIsDeletedFalse(Long orderId);

    List<ServiceReviewEntity> findByCustomerIdAndIsDeletedFalseOrderByCreatedAtDesc(Long customerId);

    List<ServiceReviewEntity> findByStylistIdAndIsDeletedFalse(Long stylistId);

    @Query("SELECT COUNT(r) FROM ServiceReviewEntity r WHERE r.stylist.id = :stylistId AND r.isDeleted = false")
    long countByStylistId(@Param("stylistId") Long stylistId);

    @Query("SELECT AVG(CAST(r.rating as double)) FROM ServiceReviewEntity r WHERE r.stylist.id = :stylistId AND r.isDeleted = false")
    Double getAverageRatingByStylistId(@Param("stylistId") Long stylistId);
}
