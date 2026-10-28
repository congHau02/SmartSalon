package com.smartsalon.shift.repository;

import com.smartsalon.shift.entity.ShiftTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftTemplateRepository extends JpaRepository<ShiftTemplateEntity, Long> {
    List<ShiftTemplateEntity> findByBranchIdAndIsDeletedFalseOrderByStartTimeAsc(Long branchId);
    List<ShiftTemplateEntity> findByBranchIdAndIsActiveTrueAndIsDeletedFalseOrderByStartTimeAsc(Long branchId);
    Optional<ShiftTemplateEntity> findByIdAndIsDeletedFalse(Long id);
    Optional<ShiftTemplateEntity> findByBranchIdAndCodeAndIsDeletedFalse(Long branchId, String code);
    boolean existsByBranchIdAndCodeAndIdNotAndIsDeletedFalse(Long branchId, String code, Long id);
}
