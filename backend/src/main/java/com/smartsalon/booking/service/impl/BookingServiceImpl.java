package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.BookingMapper;
import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    public static final BigDecimal DEPOSIT_RATE = BookingEntity.DEPOSIT_RATE;
    public static final int HOLD_TTL_MINUTES = BookingEntity.HOLD_TTL_MINUTES;

    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final BookingMapper bookingMapper;
    private final StylistSlotAssignmentService stylistSlotAssignmentService;
    private final BookingCreditSettlementHelper creditSettlementHelper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse holdSlotAndCreate(CreateBookingRequest request) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.branchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        List<ServiceEntity> services = resolveActiveServices(request.serviceIds());
        int totalDurationMinutes = Math.max(30, services.stream().mapToInt(ServiceEntity::getDurationMinutes).sum());

        LocalDateTime startTime = request.bookingTime();
        LocalDateTime endTime = startTime.plusMinutes(totalDurationMinutes);
        LocalDateTime now = LocalDateTime.now();
        validateSlotOperatingWindow(startTime, endTime, now);

        BigDecimal totalPrice = services.stream()
                .map(ServiceEntity::getBasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal depositAmount = BookingEntity.calculateDepositAmount(totalPrice);
        String bookingCode = generateUniqueBookingCode(startTime);

        UserEntity assignedStylist = stylistSlotAssignmentService.assignAndLockStylist(
                branch, request.stylistId(), startTime, endTime, now, bookingCode);

        BookingCreditSettlementHelper.CreditResolution creditResolution =
                creditSettlementHelper.resolveCustomerAndApplyCredit(request, branch, depositAmount);

        BookingEntity booking = creditSettlementHelper.buildDraftBooking(
                request, branch, creditResolution, assignedStylist, bookingCode,
                startTime, endTime, now, totalDurationMinutes, totalPrice, depositAmount, services);

        return persistBookingAndReleaseIfConfirmed(booking, assignedStylist, startTime, endTime, creditResolution, depositAmount);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByCode(String code) {
        BookingEntity booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> lookupBookingsByPhone(String phone, String bookingCode) {
        if (phone == null || phone.isBlank()) {
            return List.of();
        }
        String cleanPhone = phone.trim();
        if (!canLookupAllBookingsByPhone(cleanPhone)) {
            if (bookingCode == null || bookingCode.isBlank()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
            return findSingleByPhoneAndCode(cleanPhone, bookingCode.trim());
        }
        if (bookingCode != null && !bookingCode.isBlank()) {
            return findSingleByPhoneAndCode(cleanPhone, bookingCode.trim());
        }
        return bookingRepository.findByCustomerPhoneAndIsDeletedFalseOrderByBookingTimeDesc(cleanPhone).stream()
                .map(bookingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(Long branchId, BookingStatus status, LocalDate date, String search) {
        LocalDateTime startDate = date != null ? date.atStartOfDay() : null;
        LocalDateTime endDate = date != null ? date.plusDays(1).atStartOfDay() : null;
        String searchKeyword = (search != null && !search.isBlank()) ? search.trim() : null;

        return bookingRepository.searchBookings(branchId, status, startDate, endDate, searchKeyword).stream()
                .map(bookingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse updateBookingStatus(Long id, UpdateBookingStatusRequest request) {
        BookingEntity booking = bookingRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        creditSettlementHelper.checkBranchAccess(booking);
        BookingStatus newStatus = request.status();
        BookingStatus oldStatus = booking.getStatus();

        if (!booking.canTransitionTo(newStatus)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        if (newStatus == BookingStatus.CANCELLED) {
            if (request.notes() != null && !request.notes().isBlank()) {
                booking.setNotes(request.notes().trim());
            }
            return bookingMapper.toResponse(cancelBooking(booking));
        }

        applyStatusTransition(booking, oldStatus, newStatus);
        if (request.notes() != null && !request.notes().isBlank()) {
            booking.setNotes(request.notes().trim());
        }

        booking = bookingRepository.save(booking);
        creditSettlementHelper.notifyStatusChanged(booking, oldStatus, newStatus);
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingEntity cancelBooking(BookingEntity booking) {
        BookingStatus oldStatus = booking.getStatus();
        if (oldStatus != BookingStatus.PENDING_PAYMENT && oldStatus != BookingStatus.CONFIRMED && oldStatus != BookingStatus.CHECKED_IN) {
            throw new AppException(ErrorCode.INVALID_BOOKING_STATUS);
        }
        if (oldStatus == BookingStatus.PENDING_PAYMENT) {
            stylistSlotAssignmentService.unlockStylistSlots(booking.getStaff(), booking.getBookingTime(), booking.getEndTime());
        }
        booking.setStatus(BookingStatus.CANCELLED);
        creditSettlementHelper.refundDepositToCreditIfPaid(booking);

        BookingEntity savedBooking = bookingRepository.save(booking);
        creditSettlementHelper.notifyStatusChanged(savedBooking, oldStatus, BookingStatus.CANCELLED);
        return savedBooking;
    }

    private List<ServiceEntity> resolveActiveServices(List<Long> serviceIds) {
        List<ServiceEntity> services = serviceRepository.findAllById(serviceIds).stream()
                .filter(s -> !s.isDeleted() && s.isActive())
                .toList();
        if (services.size() != serviceIds.size()) {
            throw new AppException(ErrorCode.SERVICE_NOT_FOUND);
        }
        return services;
    }

    private void validateSlotOperatingWindow(LocalDateTime startTime, LocalDateTime endTime, LocalDateTime now) {
        if (startTime.isBefore(now)) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
        LocalTime openTime = SlotCalculationServiceImpl.OPENING_TIME;
        LocalTime closeTime = SlotCalculationServiceImpl.CLOSING_TIME;
        if (startTime.toLocalTime().isBefore(openTime) || endTime.toLocalTime().isAfter(closeTime)
                || !endTime.toLocalDate().isEqual(startTime.toLocalDate())) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }
    }

    private String generateUniqueBookingCode(LocalDateTime startTime) {
        String datePart = startTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        for (int attempts = 0; attempts <= 30; attempts++) {
            String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            String code = "BK-" + datePart + "-" + randomPart;
            if (bookingRepository.findByBookingCodeAndIsDeletedFalse(code).isEmpty()) {
                return code;
            }
        }
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    private BookingResponse persistBookingAndReleaseIfConfirmed(
            BookingEntity booking,
            UserEntity assignedStylist,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BookingCreditSettlementHelper.CreditResolution creditResolution,
            BigDecimal depositAmount) {
        try {
            BookingEntity saved = bookingRepository.save(booking);
            if (creditResolution.coveredByCredit()) {
                stylistSlotAssignmentService.unlockStylistSlots(assignedStylist, startTime, endTime);
            }
            creditSettlementHelper.recordInitialTransactionAndNotify(saved, creditResolution, depositAmount);
            return bookingMapper.toResponse(saved);
        } catch (Exception ex) {
            log.error("Failed to save booking, releasing Redis lock: {}", ex.getMessage());
            stylistSlotAssignmentService.unlockStylistSlots(assignedStylist, startTime, endTime);
            throw ex;
        }
    }

    private void applyStatusTransition(BookingEntity booking, BookingStatus oldStatus, BookingStatus newStatus) {
        if (newStatus == BookingStatus.EXPIRED) {
            if (oldStatus == BookingStatus.PENDING_PAYMENT) {
                stylistSlotAssignmentService.unlockStylistSlots(booking.getStaff(), booking.getBookingTime(), booking.getEndTime());
            }
            booking.expireHold();
        } else if (newStatus == BookingStatus.CONFIRMED) {
            if (oldStatus == BookingStatus.PENDING_PAYMENT) {
                booking.confirmDeposit();
                stylistSlotAssignmentService.unlockStylistSlots(booking.getStaff(), booking.getBookingTime(), booking.getEndTime());
            } else {
                booking.setSlotLockExpiresAt(null);
                booking.setStatus(BookingStatus.CONFIRMED);
            }
        } else {
            booking.setStatus(newStatus);
        }
    }

    private boolean canLookupAllBookingsByPhone(String cleanPhone) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return false;
        }
        boolean isPrivilegedStaff = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_STAFF") || a.getAuthority().equals("ROLE_STYLIST"));
        boolean isSelfCustomer = auth.getName() != null && auth.getName().equals(cleanPhone);
        return isPrivilegedStaff || isSelfCustomer;
    }

    private List<BookingResponse> findSingleByPhoneAndCode(String cleanPhone, String code) {
        return bookingRepository.findByCustomerPhoneAndBookingCodeAndIsDeletedFalse(cleanPhone, code)
                .map(bookingMapper::toResponse)
                .map(List::of)
                .orElseGet(List::of);
    }
}
