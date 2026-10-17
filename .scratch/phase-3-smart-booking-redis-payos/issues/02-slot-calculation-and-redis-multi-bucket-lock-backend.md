# Issue 02: SlotCalculationService & Redis 8 Multi-Bucket Lock Engine

Status: resolved
Blocked by: 01

## Description

Implement `RedisLockService` and `SlotCalculationService` to calculate 30-minute time slots (`08:30` – `20:30`), detect time-window overlaps (`RequestStart < ExistingEnd AND RequestEnd > ExistingStart`), support both specific Stylist and "Any Available Stylist" (least-workload auto-assignment), and atomically lock all 30-minute buckets in Redis 8 for 5 minutes (`300s`).

## Tasks

- [x] Configure `EnableScheduling` and Redis string/template support if needed.
- [x] Implement `RedisLockService` with `tryLockSlots`, `isAnySlotLocked`, and `unlockSlots` using `multiSetIfAbsent` on `lock:slot:{stylistId}:{date}:{HH:mm}` with 300s TTL.
- [x] Expose public/customer-accessible endpoint `GET /api/v1/stylists?branchId=...` (or `/api/v1/bookings/stylists`) so customers can view active stylists for a branch without requiring `ADMIN`/`MANAGER` role.
- [x] Implement `SlotCalculationService` and `GET /api/v1/bookings/available-slots` accepting `branchId`, `date`, `serviceIds`, and optional `stylistId`.
- [x] Implement least-workload Stylist selector for `stylistId == null` ("Any Available Stylist").
- [x] Write unit and integration tests for `SlotCalculationService` and `RedisLockService`.

## Answer

Implemented `RedisLockService`, `SlotCalculationService`, and associated entities, repositories, DTOs, and REST controllers:
1. **`RedisLockService` & `RedisLockServiceImpl`**:
   - Manages atomic multi-bucket Redis distributed locks using `stringRedisTemplate.opsForValue().multiSetIfAbsent(map)` across 30-minute slot buckets (`lock:slot:{stylistId}:{yyyy-MM-dd}:{HH:mm}`).
   - Sets 300-second (5-minute) TTL on each bucket key upon successful atomic lock.
   - Provides `isAnySlotLocked`, `unlockSlots`, and `getLockedSlots` methods.
2. **`SlotCalculationService` & `SlotCalculationServiceImpl`**:
   - Calculates 30-minute intervals between `08:30` and `20:30` taking into account the combined duration of all requested services (`totalDurationMinutes`).
   - Automatically calculates total price and 20% required deposit (`depositAmount`).
   - Detects DB overlaps via `bookingRepository.findOverlappingBookingsForStylist` (`(RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)`) for confirmed or active hold bookings.
   - Detects Redis hold collisions via `redisLockService.isAnySlotLocked`.
   - Supports both specific `stylistId` selection and `stylistId == null` ("Any Available Stylist"), accurately computing `availableStylistCount` per slot.
3. **Public Discovery Endpoints**:
   - `GET /api/v1/stylists?branchId=...` and `GET /api/v1/bookings/stylists?branchId=...` for listing active branch stylists.
   - `GET /api/v1/bookings/available-slots?branchId=...&date=...&serviceIds=...&stylistId=...` for calculating slot availability.
   - Configured in `SecurityConfig` to permit public access.
4. **Automated Verification**:
   - `RedisLockServiceTest`: Unit tests verifying atomic multi-bucket key generation, collision detection, and TTL expiration.
   - `SlotCalculationIntegrationTest`: Integration tests verifying public stylist discovery, slot generation, 20% deposit computation, DB overlap detection (`BOOKED`), Redis lock detection (`LOCKED`), and "Any Stylist" mode.
   - Full test suite passes: 45 tests run, 0 failures, 0 errors.

## Comments

