package com.smartsalon.pos.repository;

import com.smartsalon.pos.entity.OrderStepAssignmentEntity;
import com.smartsalon.pos.entity.StepAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStepAssignmentRepository extends JpaRepository<OrderStepAssignmentEntity, Long> {

    List<OrderStepAssignmentEntity> findByOrderItemId(Long orderItemId);

    @Query("SELECT s FROM OrderStepAssignmentEntity s WHERE s.staff.id = :staffId AND s.status = :status")
    List<OrderStepAssignmentEntity> findByStaffIdAndStatus(
            @Param("staffId") Long staffId,
            @Param("status") StepAssignmentStatus status);

    @Query("SELECT s FROM OrderStepAssignmentEntity s WHERE s.orderItem.order.id = :orderId")
    List<OrderStepAssignmentEntity> findByOrderId(@Param("orderId") Long orderId);
}
