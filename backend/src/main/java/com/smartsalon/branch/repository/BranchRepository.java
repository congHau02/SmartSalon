package com.smartsalon.branch.repository;

import com.smartsalon.branch.entity.BranchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<BranchEntity, Long> {
    Optional<BranchEntity> findByIdAndIsDeletedFalse(Long id);
    List<BranchEntity> findAllByIsDeletedFalseAndIsActiveTrue();
    List<BranchEntity> findAllByIsDeletedFalse();
}
