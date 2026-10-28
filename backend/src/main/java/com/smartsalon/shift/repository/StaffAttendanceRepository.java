package com.smartsalon.shift.repository;

import com.smartsalon.shift.entity.StaffAttendanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendanceEntity, Long> {
    Optional<StaffAttendanceEntity> findByUserIdAndAttendanceDateAndIsDeletedFalse(Long userId, LocalDate attendanceDate);

    List<StaffAttendanceEntity> findByBranchIdAndAttendanceDateBetweenAndIsDeletedFalse(
            Long branchId, LocalDate startDate, LocalDate endDate);

    List<StaffAttendanceEntity> findByBranchIdAndAttendanceDateAndIsDeletedFalse(Long branchId, LocalDate attendanceDate);
}
