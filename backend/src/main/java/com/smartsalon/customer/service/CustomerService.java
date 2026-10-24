package com.smartsalon.customer.service;

import com.smartsalon.customer.dto.*;

import java.util.List;

public interface CustomerService {
    CustomerLoyaltyDto getLoyaltyPreview(String phone);

    CustomerSummaryDto getCustomerSummary(String username);

    List<CustomerBookingResponse> getCustomerBookings(String username);

    CustomerBookingResponse cancelCustomerBooking(String username, Long bookingId);

    List<CustomerOrderResponse> getCustomerOrders(String username);

    CustomerReviewDto submitServiceReview(String username, Long orderId, CreateServiceReviewRequest request);
}
