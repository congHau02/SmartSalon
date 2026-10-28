package com.smartsalon.shift.repository;

import com.smartsalon.shift.entity.StaffScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffScheduleEntity, Long> {
    Optional<StaffScheduleEntity> findByUserIdAndScheduleDateAndIsDeletedFalse(Long userId, LocalDate scheduleDate);

    List<StaffScheduleEntity> findByBranchIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(
            Long branchId, LocalDate startDate, LocalDate endDate);

    List<StaffScheduleEntity> findByUserIdAndScheduleDateBetweenAndIsDeletedFalseOrderByScheduleDateAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    List<StaffScheduleEntity> findByUserIdInAndScheduleDateBetweenAndIsDeletedFalse(
            java.util.Collection<Long> userIds, LocalDate startDate, LocalDate endDate);

    List<StaffScheduleEntity> findByBranchIdAndScheduleDateAndIsDeletedFalse(Long branchId, LocalDate scheduleDate);

    @Query("SELECT s FROM StaffScheduleEntity s WHERE s.branch.id = :branchId AND s.scheduleDate BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    List<StaffScheduleEntity> findSchedulesForRoster(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
