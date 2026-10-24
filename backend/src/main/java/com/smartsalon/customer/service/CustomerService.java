package com.smartsalon.customer.service;

import com.smartsalon.customer.dto.CustomerLoyaltyDto;

public interface CustomerService {
    CustomerLoyaltyDto getLoyaltyPreview(String phone);
}
