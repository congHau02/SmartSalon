# 01: Real-Time Booking Push Notifications to Receptionist & POS Screens

**What to build:** When a customer creates a new `Booking` or completes a 20% `Deposit` payment via PayOS webhook or sandbox simulation, the system broadcasts a branch-scoped STOMP WebSocket event to all connected receptionist and POS screens for that branch. Open receptionist screens immediately display a floating toast alert, play a subtle notification chime, increment the unread badge on the header Notification Bell dropdown (recording the event in the session notification feed), and refresh their appointment and dispatch queries without requiring a manual page reload.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A STOMP WebSocket broker is active and accepts client connections (both native WebSocket and SockJS fallback), broadcasting branch-scoped booking events to the branch bookings topic and dispatch events to the branch dispatch topic.
- [x] Creating a `Booking`, confirming a `Deposit` via PayOS webhook or sandbox simulation, or updating a `Booking` status publishes a structured real-time notification payload containing the event type, branch ID, booking code, customer info, and timestamp.
- [x] The receptionist and POS layouts display a live WebSocket connection status badge and an interactive Notification Bell with an unread counter and dropdown feed of recent booking and deposit events.
- [x] Incoming booking and deposit confirmation events trigger an on-screen toast notification, play an audio chime, and automatically invalidate active booking and dispatch queries so the UI updates in real time.
- [x] Automated backend tests verify that booking creation, deposit confirmation, and status transitions publish the expected payloads to the branch WebSocket topic, and the frontend compiles and lints cleanly.
