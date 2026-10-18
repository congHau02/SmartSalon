# 0008 Branch-Scoped STOMP WebSocket Topics for Real-Time Receptionist & POS Dispatch

We adopted Spring WebSocket with an in-memory STOMP broker (`/ws`) broadcasting branch-scoped events to `/topic/branch/{branchId}/bookings` and `/topic/branch/{branchId}/dispatch`.

## Context

Receptionists and cashiers operating the `Dispatch Board` (`/pos` and `/admin/bookings`) need immediate visual and audio alerts when a customer creates a new `Booking` or completes a `Deposit` payment via PayOS webhook, as well as live synchronization when another terminal checks in a customer, updates a `Step Assignment`, or completes an `Order` checkout. Polling every few seconds across all open POS terminals would create unnecessary database load and latency.

## Decision

1. **STOMP Endpoint & Broker**:
   - Configure `@EnableWebSocketMessageBroker` in `WebSocketConfig` exposing `/ws` (supporting both native WebSocket and SockJS fallback) and enabling the `/topic` broker prefix.
2. **Branch-Scoped Topics**:
   - `/topic/branch/{branchId}/bookings`: Emits `BookingNotificationEvent` (`BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_STATUS_CHANGED`) with booking summary payload so Receptionist screens immediately surface toast alerts, increment the notification badge, and invalidate React Query caches.
   - `/topic/branch/{branchId}/dispatch`: Emits `DispatchUpdateEvent` (`ORDER_CHECKED_IN`, `WALK_IN_CREATED`, `STEP_UPDATED`, `VISUAL_LOG_SAVED`, `ORDER_CHECKED_OUT`) whenever a POS operational state changes at that branch.

## Consequences

- Multi-branch isolation is preserved at the subscription level: a receptionist viewing Branch 1 only receives events for Branch 1.
- POS Kanban and Timeline views stay synchronized in real time across multiple receptionist and stylist tablets without manual page refreshes.
