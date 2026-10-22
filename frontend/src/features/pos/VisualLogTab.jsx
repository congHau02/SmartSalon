import React from "react";
import { Save, Loader2 } from "lucide-react";
import { BomOverrideTable } from "./components/BomOverrideTable";
import { AddConsumableModal } from "./components/AddConsumableModal";
import { VisualLogNotesForm } from "./components/VisualLogNotesForm";
import { BeforeAfterPhotoSection } from "./components/BeforeAfterPhotoSection";
import { VisualLogHeader } from "./components/VisualLogHeader";
import { VisualLogImageModal } from "./components/VisualLogImageModal";
import { useVisualLogForm } from "./useVisualLogForm";

export function VisualLogTab({
  orderId,
  order,
  stylists = [],
  products = [],
  onNotice,
}) {
  const {
    technicianId,
    setTechnicianId,
    beforeImageUrl,
    setBeforeImageUrl,
    afterImageUrl,
    setAfterImageUrl,
    formulaNotes,
    setFormulaNotes,
    hairConditionNotes,
    setHairConditionNotes,
    bomItems,
    isAddChemicalOpen,
    setIsAddChemicalOpen,
    isUploadingBefore,
    isUploadingAfter,
    previewImage,
    setPreviewImage,
    isLoading,
    saveMutation,
    handleFileUpload,
    handleAmountChange,
    handleRemoveItem,
    handleAddChemical,
    handleSave,
  } = useVisualLogForm({ orderId, order, products, onNotice });

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin text-pink-500" />
        <span className="text-xs">Đang tải hồ sơ kỹ thuật Visual Log...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VisualLogHeader
        technicianId={technicianId}
        setTechnicianId={setTechnicianId}
        stylists={stylists}
      />

      <BomOverrideTable
        bomItems={bomItems}
        onOpenAddChemical={() => setIsAddChemicalOpen(true)}
        onAmountChange={handleAmountChange}
        onRemoveItem={handleRemoveItem}
      />

      <AddConsumableModal
        isOpen={isAddChemicalOpen}
        onClose={() => setIsAddChemicalOpen(false)}
        products={products}
        onAddChemical={handleAddChemical}
      />

      <VisualLogNotesForm
        formulaNotes={formulaNotes}
        setFormulaNotes={setFormulaNotes}
        hairConditionNotes={hairConditionNotes}
        setHairConditionNotes={setHairConditionNotes}
      />

      <BeforeAfterPhotoSection
        photos={{
          beforeImageUrl,
          setBeforeImageUrl,
          afterImageUrl,
          setAfterImageUrl,
          isUploadingBefore,
          isUploadingAfter,
        }}
        onFileUpload={handleFileUpload}
        onPreviewImage={(url) => setPreviewImage(url)}
      />

      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || isUploadingBefore || isUploadingAfter}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-pink-600/20 cursor-pointer"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu Visual Log...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu Visual Log & Định mức hóa chất</span>
            </>
          )}
        </button>
      </div>

      <VisualLogImageModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
