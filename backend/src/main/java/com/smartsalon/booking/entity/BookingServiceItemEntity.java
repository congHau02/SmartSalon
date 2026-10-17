package com.smartsalon.booking.entity;

import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "booking_services")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingServiceItemEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private int durationMinutes = 30;
}
