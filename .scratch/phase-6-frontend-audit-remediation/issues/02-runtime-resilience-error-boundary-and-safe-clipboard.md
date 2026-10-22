# 02: Portal-Level Error Boundaries, Safe LAN Clipboard & Visual Log Upload Guards

**What to build:** Introduce a reusable React class-based `ErrorBoundary` component with dev error inspection and a "Tải lại giao diện" reset button, wrapping Customer, POS Dispatch Board, and Admin portal route containers to prevent unhandled UI render crashes. Provide a safe `copyToClipboard` utility with non-HTTPS LAN fallback (`document.execCommand("copy")`) and adopt it in deposit QR and checkout views. Enforce a 10MB client-side image size guard in `VisualLogTab`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Reusable `ErrorBoundary` component created and applied to Customer, POS, and Admin layouts.
- [x] Safe `copyToClipboard` utility implemented and integrated into `DepositQrStep` and `PosCheckoutTab` without unhandled promise rejections on non-HTTPS networks.
- [x] 10MB client-side file size validation added to `VisualLogTab` before multipart upload with clear Vietnamese feedback.
