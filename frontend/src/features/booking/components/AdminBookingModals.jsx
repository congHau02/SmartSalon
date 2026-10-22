import React from "react";
import { AdminBookingDetailModal } from "./AdminBookingDetailModal";
import { AdminBookingStatusModal } from "./AdminBookingStatusModal";

export { AdminBookingDetailModal, AdminBookingStatusModal };

/**
 * Backward compatibility wrapper
 */
export function AdminBookingModals({
  detailBooking,
  setDetailBooking,
  statusModalBooking,
  setStatusModalBooking,
  onConfirmStatusUpdate,
  isUpdatingStatus,
}) {
  return (
    <>
      <AdminBookingDetailModal
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
      />
      <AdminBookingStatusModal
        booking={statusModalBooking}
        onClose={() => setStatusModalBooking(null)}
        onConfirm={onConfirmStatusUpdate}
        isUpdating={isUpdatingStatus}
      />
    </>
  );
}
