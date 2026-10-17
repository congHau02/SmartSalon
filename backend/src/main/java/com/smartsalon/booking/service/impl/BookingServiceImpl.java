package com.smartsalon.booking.service.impl;

import com.smartsalon.booking.dto.BookingResponse;
import com.smartsalon.booking.dto.BookingServiceItemDto;
import com.smartsalon.booking.dto.CreateBookingRequest;
import com.smartsalon.booking.dto.UpdateBookingStatusRequest;
import com.smartsalon.booking.entity.BookingEntity;
import com.smartsalon.booking.entity.BookingServiceItemEntity;
import com.smartsalon.booking.entity.BookingStatus;
import com.smartsalon.booking.entity.DepositStatus;
import com.smartsalon.booking.repository.BookingRepository;
import com.smartsalon.booking.service.BookingService;
import com.smartsalon.booking.service.RedisLockService;
import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.catalog.entity.ServiceEntity;
import com.smartsalon.catalog.repository.ServiceRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.user.entity.RoleEntity;
import com.smartsalon.user.entity.UserEntity;
import com.smartsalon.user.repository.RoleRepository;
import com.smartsalon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    public static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.20");
    public static final int HOLD_TTL_MINUTES = 5;

    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RedisLockService redisLockService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse holdSlotAndCreate(CreateBookingRequest request) {
        BranchEntity branch = branchRepository.findByIdAndIsDeletedFalse(request.branchId())
                .orElseThrow(() -> new AppException(ErrorCode.BRANCH_NOT_FOUND));

        List<Long> serviceIds = request.serviceIds();
        List<ServiceEntity> services = serviceRepository.findAllById(serviceIds).stream()
                .filter(s -> !s.isDeleted() && s.isActive())
                .toList();

        if (services.size() != serviceIds.size()) {
            throw new AppException(ErrorCode.SERVICE_NOT_FOUND);
        }

        int totalDurationMinutes = services.stream().mapToInt(ServiceEntity::getDurationMinutes).sum();
        if (totalDurationMinutes <= 0) {
            totalDurationMinutes = 30;
        }

        LocalDateTime startTime = request.bookingTime();
        LocalDateTime endTime = startTime.plusMinutes(totalDurationMinutes);
        LocalDateTime now = LocalDateTime.now();

        if (startTime.isBefore(now)) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        LocalTime openTime = SlotCalculationServiceImpl.OPENING_TIME;
        LocalTime closeTime = SlotCalculationServiceImpl.CLOSING_TIME;
        if (startTime.toLocalTime().isBefore(openTime) || endTime.toLocalTime().isAfter(closeTime)
                || !endTime.toLocalDate().isEqual(startTime.toLocalDate())) {
            throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
        }

        BigDecimal totalPrice = services.stream()
                .map(ServiceEntity::getBasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal depositAmount = totalPrice.multiply(DEPOSIT_RATE).setScale(0, RoundingMode.HALF_UP);

        String datePart = startTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String bookingCode;
        int attempts = 0;
        do {
            String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            bookingCode = "BK-" + datePart + "-" + randomPart;
            attempts++;
            if (attempts > 30) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }
        } while (bookingRepository.findByBookingCodeAndIsDeletedFalse(bookingCode).isPresent());

        UserEntity assignedStylist;

        if (request.stylistId() != null) {
            UserEntity stylist = userRepository.findById(request.stylistId())
                    .filter(u -> u.isActive() && !u.isDeleted())
                    .orElseThrow(() -> new AppException(ErrorCode.STYLIST_NOT_FOUND));

            boolean isStylist = stylist.getRoles().stream().anyMatch(r -> "STYLIST".equals(r.getName()));
            if (!isStylist) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
            }
            if (stylist.getBranch() != null && !stylist.getBranch().getId().equals(branch.getId())) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }

            List<BookingEntity> overlaps = bookingRepository.findOverlappingBookingsForStylist(
                    stylist.getId(), startTime, endTime, now);
            if (!overlaps.isEmpty()) {
                throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
            }

            boolean locked = redisLockService.tryLockSlots(stylist.getId(), startTime, endTime, bookingCode);
            if (!locked) {
                throw new AppException(ErrorCode.SLOT_ALREADY_LOCKED);
            }
            assignedStylist = stylist;
        } else {
            // "Any Available Stylist": auto-assign free stylist with least booked minutes today
            List<UserEntity> activeStylists = userRepository.findActiveStylistsByBranchId(branch.getId());
            if (activeStylists.isEmpty()) {
                throw new AppException(ErrorCode.STYLIST_NOT_FOUND);
            }

            List<UserEntity> freeStylists = activeStylists.stream()
                    .filter(s -> bookingRepository.findOverlappingBookingsForStylist(s.getId(), startTime, endTime, now).isEmpty())
                    .filter(s -> !redisLockService.isAnySlotLocked(s.getId(), startTime, endTime))
                    .toList();

            if (freeStylists.isEmpty()) {
                throw new AppException(ErrorCode.SLOT_NOT_AVAILABLE);
            }

            LocalDateTime dayStart = startTime.toLocalDate().atTime(openTime);
            LocalDateTime dayEnd = startTime.toLocalDate().atTime(closeTime);
            List<BookingEntity> dayBookings = bookingRepository.findActiveBookingsByBranchAndDay(branch.getId(), dayStart, dayEnd, now);
            Map<Long, Integer> stylistWorkload = new HashMap<>();
            for (BookingEntity b : dayBookings) {
                if (b.getStaff() != null) {
                    stylistWorkload.merge(b.getStaff().getId(), b.getTotalDurationMinutes(), Integer::sum);
                }
            }

            List<UserEntity> sortedCandidates = freeStylists.stream()
                    .sorted(Comparator.comparingInt(s -> stylistWorkload.getOrDefault(s.getId(), 0)))
                    .toList();

            UserEntity lockedStylist = null;
            for (UserEntity candidate : sortedCandidates) {
                if (redisLockService.tryLockSlots(candidate.getId(), startTime, endTime, bookingCode)) {
                    lockedStylist = candidate;
                    break;
                }
            }

            if (lockedStylist == null) {
                throw new AppException(ErrorCode.SLOT_ALREADY_LOCKED);
            }
            assignedStylist = lockedStylist;
        }

        // Resolve customer: if authenticated user has CUSTOMER role, bind them.
        // Otherwise (unauthenticated or staff/admin booking for walk-in), resolve by phone.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity customer = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            UserEntity authUser = userRepository.findByUsernameAndIsDeletedFalse(auth.getName()).orElse(null);
            if (authUser != null && authUser.getRoles().stream().anyMatch(r -> "CUSTOMER".equals(r.getName()))) {
                customer = authUser;
            }
        }

        String phone = request.customerPhone().trim();
        if (customer == null) {
            Optional<UserEntity> phoneUser = userRepository.findByPhoneAndIsDeletedFalse(phone);
            if (phoneUser.isPresent()) {
                customer = phoneUser.get();
            } else {
                String username = userRepository.existsByUsername(phone) ? "guest_" + phone : phone;
                RoleEntity customerRole = roleRepository.findByName("CUSTOMER")
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                UserEntity newGuest = UserEntity.builder()
                        .username(username)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .fullName(request.customerName().trim())
                        .phone(phone)
                        .branch(branch)
                        .isActive(true)
                        .roles(Set.of(customerRole))
                        .build();
                customer = userRepository.save(newGuest);
            }
        }

        BookingEntity booking = BookingEntity.builder()
                .branch(branch)
                .customer(customer)
                .staff(assignedStylist)
                .bookingCode(bookingCode)
                .bookingTime(startTime)
                .endTime(endTime)
                .totalDurationMinutes(totalDurationMinutes)
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .depositStatus(DepositStatus.UNPAID)
                .status(BookingStatus.PENDING_PAYMENT)
                .slotLockExpiresAt(now.plusMinutes(HOLD_TTL_MINUTES))
                .customerName(request.customerName().trim())
                .customerPhone(phone)
                .notes(request.notes())
                .items(new ArrayList<>())
                .build();

        for (ServiceEntity service : services) {
            BookingServiceItemEntity item = BookingServiceItemEntity.builder()
                    .booking(booking)
                    .service(service)
                    .price(service.getBasePrice())
                    .durationMinutes(service.getDurationMinutes())
                    .build();
            booking.addItem(item);
        }

        try {
            booking = bookingRepository.save(booking);
        } catch (Exception ex) {
            log.error("Failed to save booking, releasing Redis lock: {}", ex.getMessage());
            redisLockService.unlockSlots(assignedStylist.getId(), startTime, endTime);
            throw ex;
        }

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByCode(String code) {
        BookingEntity booking = bookingRepository.findByBookingCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));
        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> lookupBookingsByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return List.of();
        }
        return bookingRepository.findByCustomerPhoneAndIsDeletedFalseOrderByBookingTimeDesc(phone.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(Long branchId, BookingStatus status, LocalDate date, String search) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        if (date != null) {
            startDate = date.atStartOfDay();
            endDate = date.plusDays(1).atStartOfDay();
        }
        String searchKeyword = (search != null && !search.isBlank()) ? search.trim() : null;

        return bookingRepository.searchBookings(branchId, status, startDate, endDate, searchKeyword).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse updateBookingStatus(Long id, UpdateBookingStatusRequest request) {
        BookingEntity booking = bookingRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        BookingStatus newStatus = request.status();
        BookingStatus oldStatus = booking.getStatus();

        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        if (newStatus == BookingStatus.CANCELLED || newStatus == BookingStatus.EXPIRED) {
            if (oldStatus == BookingStatus.PENDING_PAYMENT && booking.getStaff() != null) {
                redisLockService.unlockSlots(booking.getStaff().getId(), booking.getBookingTime(), booking.getEndTime());
            }
        } else if (newStatus == BookingStatus.CONFIRMED) {
            booking.setSlotLockExpiresAt(null);
        }

        booking.setStatus(newStatus);
        if (request.notes() != null && !request.notes().isBlank()) {
            booking.setNotes(request.notes().trim());
        }

        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    private boolean isValidStatusTransition(BookingStatus from, BookingStatus to) {
        if (from == to) return true;
        return switch (from) {
            case PENDING_PAYMENT -> to == BookingStatus.CONFIRMED || to == BookingStatus.CANCELLED || to == BookingStatus.EXPIRED;
            case CONFIRMED -> to == BookingStatus.CHECKED_IN || to == BookingStatus.CANCELLED || to == BookingStatus.NO_SHOW;
            case CHECKED_IN -> to == BookingStatus.IN_PROGRESS || to == BookingStatus.CANCELLED;
            case IN_PROGRESS -> to == BookingStatus.COMPLETED;
            case COMPLETED, CANCELLED, EXPIRED, NO_SHOW -> false;
        };
    }

    private BookingResponse toResponse(BookingEntity entity) {
        List<BookingServiceItemDto> items = entity.getItems().stream()
                .map(item -> new BookingServiceItemDto(
                        item.getId(),
                        item.getService() != null ? item.getService().getId() : null,
                        item.getService() != null ? item.getService().getName() : "",
                        item.getPrice(),
                        item.getDurationMinutes()
                ))
                .toList();

        return new BookingResponse(
                entity.getId(),
                entity.getBookingCode(),
                entity.getBranch().getId(),
                entity.getBranch().getName(),
                entity.getCustomer() != null ? entity.getCustomer().getId() : null,
                entity.getCustomerName() != null ? entity.getCustomerName() : (entity.getCustomer() != null ? entity.getCustomer().getFullName() : ""),
                entity.getCustomerPhone() != null ? entity.getCustomerPhone() : (entity.getCustomer() != null ? entity.getCustomer().getPhone() : ""),
                entity.getStaff() != null ? entity.getStaff().getId() : null,
                entity.getStaff() != null ? entity.getStaff().getFullName() : null,
                entity.getBookingTime(),
                entity.getEndTime(),
                entity.getTotalDurationMinutes(),
                entity.getTotalPrice(),
                entity.getDepositAmount(),
                entity.getDepositStatus(),
                entity.getStatus(),
                entity.getSlotLockExpiresAt(),
                entity.getNotes(),
                items,
                entity.getCreatedAt()
        );
    }
}
