package com.smartsalon.inventory.repository;

import com.smartsalon.inventory.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    Optional<ProductEntity> findByIdAndIsDeletedFalse(Long id);
    Optional<ProductEntity> findBySkuAndIsDeletedFalse(String sku);
    boolean existsBySku(String sku);
    List<ProductEntity> findAllByIsDeletedFalse();
    List<ProductEntity> findAllByIsDeletedFalseAndIsActiveTrue();
    List<ProductEntity> findByNameContainingIgnoreCaseAndIsDeletedFalse(String keyword);
    boolean existsBySkuAndIdNot(String sku, Long id);
}
