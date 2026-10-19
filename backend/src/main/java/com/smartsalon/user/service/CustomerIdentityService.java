package com.smartsalon.user.service;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.user.entity.UserEntity;

public interface CustomerIdentityService {

    String WALKIN_USERNAME = "walkin.guest";
    String WALKIN_PHONE = "0000000000";

    UserEntity resolveForBooking(String phone, String customerName, BranchEntity branch);

    ResolvedWalkInCustomer resolveForWalkIn(boolean quickGuest, String customerPhone, String customerName, BranchEntity branch);

    UserEntity resolveWalkInGuest();

    static boolean isIdentifiedCustomer(UserEntity customer, String orderCustomerPhone) {
        if (customer == null) return false;
        if (WALKIN_USERNAME.equalsIgnoreCase(customer.getUsername())) return false;
        if (WALKIN_PHONE.equals(customer.getPhone())) return false;
        if (customer.getFullName() != null && customer.getFullName().toLowerCase().contains("walk-in")) return false;
        if (orderCustomerPhone != null && WALKIN_PHONE.equals(orderCustomerPhone)) return false;
        return true;
    }

    record ResolvedWalkInCustomer(
            UserEntity user,
            String customerName,
            String customerPhone
    ) {}
}
