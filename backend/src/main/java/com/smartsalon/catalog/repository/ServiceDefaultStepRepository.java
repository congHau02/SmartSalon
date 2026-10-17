package com.smartsalon.catalog.repository;

import com.smartsalon.catalog.entity.ServiceDefaultStepEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceDefaultStepRepository extends JpaRepository<ServiceDefaultStepEntity, Long> {
    List<ServiceDefaultStepEntity> findAllByServiceIdOrderByStepOrderAsc(Long serviceId);
}
