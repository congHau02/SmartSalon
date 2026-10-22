import React from "react";
import { ServiceFormModal } from "../../ServiceFormModal";
import { DeleteConfirmModal } from "../../DeleteConfirmModal";

export function ServicesModals({
  modalState,
  deleteState,
}) {
  return (
    <>
      <ServiceFormModal
        isOpen={modalState.isOpen}
        onClose={modalState.onClose}
        initialData={modalState.initialData}
        onSubmit={modalState.onSubmit}
        isSubmitting={modalState.isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteState.service)}
        onClose={deleteState.onClose}
        service={deleteState.service}
        onConfirm={deleteState.onConfirm}
        isDeleting={deleteState.isDeleting}
      />
    </>
  );
}
