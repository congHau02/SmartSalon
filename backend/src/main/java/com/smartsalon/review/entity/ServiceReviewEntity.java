package com.smartsalon.review.entity;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.common.BaseEntity;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceReviewEntity extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stylist_id", nullable = false)
    private UserEntity stylist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchEntity branch;

    @Column(name = "rating", nullable = false)
    private int rating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
}
