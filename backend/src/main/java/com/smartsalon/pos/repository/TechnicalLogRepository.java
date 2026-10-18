package com.smartsalon.pos.repository;

import com.smartsalon.pos.entity.TechnicalLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TechnicalLogRepository extends JpaRepository<TechnicalLogEntity, Long> {
    Optional<TechnicalLogEntity> findByOrderIdAndIsDeletedFalse(Long orderId);
}
