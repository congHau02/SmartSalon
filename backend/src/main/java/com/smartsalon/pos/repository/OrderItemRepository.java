package com.smartsalon.pos.repository;

import com.smartsalon.pos.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
    List<OrderItemEntity> findByOrderIdAndIsDeletedFalse(Long orderId);
}
