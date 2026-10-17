package com.smartsalon.catalog.repository;

import com.smartsalon.catalog.entity.ServiceBomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceBomRepository extends JpaRepository<ServiceBomEntity, Long> {
    List<ServiceBomEntity> findAllByServiceIdAndIsDeletedFalse(Long serviceId);
}
