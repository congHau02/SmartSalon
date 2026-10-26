package com.smartsalon.review.repository;

import com.smartsalon.review.entity.ServiceReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceReviewRepository extends JpaRepository<ServiceReviewEntity, Long> {

    interface StylistReviewStats {
        Long getStylistId();
        Double getAverageRating();
        Long getReviewCount();
    }

    Optional<ServiceReviewEntity> findByOrderIdAndIsDeletedFalse(Long orderId);

    @Query("SELECT COUNT(r) FROM ServiceReviewEntity r WHERE r.stylist.id = :stylistId AND r.isDeleted = false")
    long countByStylistId(@Param("stylistId") Long stylistId);

    @Query("SELECT AVG(CAST(r.rating as double)) FROM ServiceReviewEntity r WHERE r.stylist.id = :stylistId AND r.isDeleted = false")
    Double getAverageRatingByStylistId(@Param("stylistId") Long stylistId);

    @Query("SELECT r.stylist.id AS stylistId, AVG(CAST(r.rating AS double)) AS averageRating, COUNT(r.id) AS reviewCount " +
           "FROM ServiceReviewEntity r WHERE r.stylist.id IN :stylistIds AND r.isDeleted = false GROUP BY r.stylist.id")
    List<StylistReviewStats> getReviewStatsByStylistIds(@Param("stylistIds") Collection<Long> stylistIds);

    @Query("SELECT AVG(CAST(r.rating as double)) FROM ServiceReviewEntity r WHERE (:branchId IS NULL OR r.branch.id = :branchId) AND r.isDeleted = false")
    Double getAverageRatingByBranchId(@Param("branchId") Long branchId);
}
