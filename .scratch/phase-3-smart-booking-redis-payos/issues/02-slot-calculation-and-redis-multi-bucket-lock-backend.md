# Issue 02: SlotCalculationService & Redis 8 Multi-Bucket Lock Engine

Status: ready-for-agent
Blocked by: 01

## Description

Implement `RedisLockService` and `SlotCalculationService` to calculate 30-minute time slots (`08:30` – `20:30`), detect time-window overlaps (`RequestStart < ExistingEnd AND RequestEnd > ExistingStart`), support both specific Stylist and "Any Available Stylist" (least-workload auto-assignment), and atomically lock all 30-minute buckets in Redis 8 for 5 minutes (`300s`).

## Tasks

- [ ] Configure `EnableScheduling` and Redis string/template support if needed.
- [ ] Implement `RedisLockService` with `tryLockSlots`, `isAnySlotLocked`, and `unlockSlots` using `multiSetIfAbsent` on `lock:slot:{stylistId}:{date}:{HH:mm}` with 300s TTL.
- [ ] Expose public/customer-accessible endpoint `GET /api/v1/stylists?branchId=...` (or `/api/v1/bookings/stylists`) so customers can view active stylists for a branch without requiring `ADMIN`/`MANAGER` role.
- [ ] Implement `SlotCalculationService` and `GET /api/v1/bookings/available-slots` accepting `branchId`, `date`, `serviceIds`, and optional `stylistId`.
- [ ] Implement least-workload Stylist selector for `stylistId == null` ("Any Available Stylist").
- [ ] Write unit and integration tests for `SlotCalculationService` and `RedisLockService`.

## Comments

