package com.smartsalon.customer.service;

import com.smartsalon.customer.dto.CustomerBookingResponse;
import com.smartsalon.customer.dto.CustomerLoyaltyDto;
import com.smartsalon.customer.dto.CustomerSummaryDto;

import java.util.List;

public interface CustomerService {
    CustomerLoyaltyDto getLoyaltyPreview(String phone);

    CustomerSummaryDto getCustomerSummary(String username);

    List<CustomerBookingResponse> getCustomerBookings(String username);

    CustomerBookingResponse cancelCustomerBooking(String username, Long bookingId);
}
