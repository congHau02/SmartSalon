package com.smartsalon.inventory.repository;

import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, Long> {

    List<InventoryTransactionEntity> findAllByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<InventoryTransactionEntity> findAllByBranchIdAndProductIdOrderByCreatedAtDesc(Long branchId, Long productId);
}
