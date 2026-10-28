package com.smartsalon.pos.service.impl;

import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.ProductRepository;
import com.smartsalon.pos.dto.ProductItemRequest;
import com.smartsalon.pos.entity.OrderEntity;
import com.smartsalon.pos.entity.OrderItemEntity;
import com.smartsalon.pos.entity.OrderItemType;
import com.smartsalon.pos.entity.OrderStatus;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.service.CustomerIdentityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PosOrderCreationHelper {

    private final BranchRepository branchRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final PosStaffResolutionHelper staffResolutionHelper;

    public PosStaffResolutionHelper staffResolution() {
        return staffResolutionHelper;
    }

    public BookingEntity findBookingOrThrow(Long bookingId) {
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        staffResolutionHelper.checkBranchAccess(booking.getBranch() != null ? booking.getBranch().getId() : null);
        if (booking.isDeleted()) {
            throw new AppException(ErrorCode.BOOKING_NOT_FOUND);
        }
        return booking;
    }

    public BranchEntity findBranchOrThrow(Long branchId, boolean filterNotDeleted) {
        staffResolutionHelper.checkBranchAccess(branchId);
        return (filterNotDeleted
                ? branchRepository.findByIdAndIsDeletedFalse(branchId)
                : branchRepository.findById(branchId))
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));
    }

    public BookingEntity saveBooking(BookingEntity booking) {
        return bookingRepository.save(booking);
    }

    public OrderEntity buildOrderFromBooking(BookingEntity booking) {
        BigDecimal depositDeducted = (booking.getDepositStatus() == DepositStatus.PAID && booking.getDepositAmount() != null)
                ? booking.getDepositAmount()
                : BigDecimal.ZERO;

        OrderEntity order = OrderEntity.builder()
                .branch(booking.getBranch())
                .customer(booking.getCustomer())
                .booking(booking)
                .orderCode(staffResolutionHelper.generateOrderCode())
                .status(OrderStatus.CHECKED_IN)
                .customerName(booking.resolvedCustomerName())
                .customerPhone(booking.resolvedCustomerPhone())
                .depositDeducted(depositDeducted)
                .notes(booking.getNotes())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        UserEntity defaultStaff = booking.getStaff() != null
                ? booking.getStaff()
                : staffResolutionHelper.resolveDefaultStaff(booking.getBranch());

        for (BookingServiceItemEntity item : booking.getItems()) {
            ServiceEntity service = item.getService();
            BigDecimal price = item.getPrice() != null ? item.getPrice() : service.getBasePrice();
            appendServiceItemWithSteps(order, service, price, defaultStaff);
        }

        order.recalculateTotals();
        order.applyMembershipTierDiscountIfAutomatic();
        return order;
    }

    public OrderEntity buildDraftWalkInOrQuickOrder(
            BranchEntity branch,
            boolean quickGuest,
            String phone,
            String name,
            String notes,
            UserEntity assignedStylist,
            List<Long> serviceIds,
            List<ProductItemRequest> productItems) {

        CustomerIdentityService.ResolvedWalkInCustomer resolvedCustomer =
                staffResolutionHelper.resolveForWalkIn(quickGuest, phone, name, branch);

        OrderEntity order = OrderEntity.builder()
                .branch(branch)
                .customer(resolvedCustomer.user())
                .booking(null)
                .orderCode(staffResolutionHelper.generateOrderCode())
                .status(OrderStatus.CHECKED_IN)
                .customerName(resolvedCustomer.customerName())
                .customerPhone(resolvedCustomer.customerPhone())
                .notes(notes)
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .depositDeducted(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        if (serviceIds != null) {
            for (Long serviceId : serviceIds) {
                addServiceToOrder(order, serviceId, assignedStylist);
            }
        }
        if (productItems != null) {
            for (ProductItemRequest pReq : productItems) {
                if (pReq.getProductId() != null) {
                    addProductToOrder(order, pReq.getProductId(), pReq.getQuantity());
                }
            }
        }
        order.recalculateTotals();
        return order;
    }

    public void addServiceToOrder(OrderEntity order, Long serviceId, UserEntity assignedStaff) {
        ServiceEntity service = serviceRepository.findByIdAndIsDeletedFalse(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
        UserEntity effectiveStaff = assignedStaff != null
                ? assignedStaff
                : staffResolutionHelper.resolveDefaultStaff(order.getBranch());
        appendServiceItemWithSteps(order, service, service.getBasePrice(), effectiveStaff);
    }

    public void addProductToOrder(OrderEntity order, Long productId, int requestedQuantity) {
        ProductEntity product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        int qty = requestedQuantity > 0 ? requestedQuantity : 1;
        BigDecimal unitPrice = product.getRetailPrice() != null ? product.getRetailPrice() : BigDecimal.ZERO;
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));

        OrderItemEntity prodItem = OrderItemEntity.builder()
                .itemType(OrderItemType.PRODUCT)
                .product(product)
                .quantity(qty)
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .build();
        order.addItem(prodItem);
    }

    public BookingStatus advanceLinkedBookingToInProgressIfNeeded(OrderEntity order) {
        if (order.getBooking() != null && order.getBooking().getStatus() != BookingStatus.IN_PROGRESS) {
            BookingStatus oldStatus = order.getBooking().getStatus();
            order.getBooking().setStatus(BookingStatus.IN_PROGRESS);
            bookingRepository.save(order.getBooking());
            return oldStatus;
        }
        return null;
    }

    private void appendServiceItemWithSteps(
            OrderEntity order,
            ServiceEntity service,
            BigDecimal price,
            UserEntity assignedStaff) {

        OrderItemEntity orderItem = OrderItemEntity.builder()
                .itemType(OrderItemType.SERVICE)
                .service(service)
                .quantity(1)
                .unitPrice(price)
                .totalPrice(price)
                .stepAssignments(new ArrayList<>())
                .build();
        order.addItem(orderItem);
        orderItem.populateDefaultStepAssignments(assignedStaff);
    }
}
