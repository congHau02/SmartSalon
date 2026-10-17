package com.smartsalon.catalog.repository;

import com.smartsalon.catalog.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {

    Optional<ServiceEntity> findByIdAndIsDeletedFalse(Long id);

    List<ServiceEntity> findAllByIsDeletedFalse();

    List<ServiceEntity> findAllByIsDeletedFalseAndIsActiveTrue();

    List<ServiceEntity> findAllByCategoryAndIsDeletedFalse(String category);

    List<ServiceEntity> findAllByCategoryAndIsDeletedFalseAndIsActiveTrue(String category);

    @Query("SELECT DISTINCT s.category FROM ServiceEntity s WHERE s.isDeleted = false ORDER BY s.category ASC")
    List<String> findDistinctCategories();
}
