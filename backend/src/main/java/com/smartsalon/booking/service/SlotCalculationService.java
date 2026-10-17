package com.smartsalon.booking.service;

import com.smartsalon.booking.dto.AvailableSlotsResponse;
import com.smartsalon.booking.dto.StylistDto;

import java.time.LocalDate;
import java.util.List;

public interface SlotCalculationService {

    AvailableSlotsResponse calculateAvailableSlots(Long branchId, LocalDate date, List<Long> serviceIds, Long stylistId);

    List<StylistDto> getActiveStylists(Long branchId);
}
