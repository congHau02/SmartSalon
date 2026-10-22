import { useState, useEffect } from "react";
import { useVisualLog, useSaveVisualLog, useUploadMedia } from "./usePosQueries";

export function useVisualLogForm({ orderId, order, products = [], onNotice }) {
  const [technicianId, setTechnicianId] = useState("");
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [formulaNotes, setFormulaNotes] = useState("");
  const [hairConditionNotes, setHairConditionNotes] = useState("");
  const [bomItems, setBomItems] = useState([]);

  const [isAddChemicalOpen, setIsAddChemicalOpen] = useState(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const { data: visualLogData, isLoading } = useVisualLog(orderId);

  useEffect(() => {
    if (visualLogData) {
      setTechnicianId(visualLogData.technicianId ? String(visualLogData.technicianId) : "");
      setBeforeImageUrl(visualLogData.beforeImageUrl || "");
      setAfterImageUrl(visualLogData.afterImageUrl || "");
      setFormulaNotes(visualLogData.formulaNotes || "");
      setHairConditionNotes(visualLogData.hairConditionNotes || "");
      setBomItems(visualLogData.chemicalConsumptions || []);
    } else if (order) {
      const firstStaffId = order.items?.flatMap((i) => i.steps || [])[0]?.staffId;
      if (firstStaffId) setTechnicianId(String(firstStaffId));
    }
  }, [visualLogData, order]);

  const saveMutation = useSaveVisualLog(orderId, {
    onSuccess: () => {
      if (onNotice) {
        onNotice({
          type: "success",
          text: "Đã lưu Visual Log và định mức hóa chất thành công!",
        });
      }
    },
    onError: (err) => {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || "Lưu Visual Log thất bại. Vui lòng thử lại.",
        });
      }
    },
  });

  const uploadMediaMutation = useUploadMedia();

  const handleFileUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      if (onNotice) {
        onNotice({
          type: "error",
          text: "Dung lượng ảnh vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.",
        });
      }
      e.target.value = "";
      return;
    }

    const isBefore = target === "before";
    const setUploading = isBefore ? setIsUploadingBefore : setIsUploadingAfter;
    const setImageUrl = isBefore ? setBeforeImageUrl : setAfterImageUrl;
    const label = isBefore ? "Trước" : "Sau";

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await uploadMediaMutation.mutateAsync(formData);
      const uploadedUrl = res?.url || res;
      setImageUrl(uploadedUrl);
      if (onNotice) {
        onNotice({
          type: "success",
          text: `Đã tải ảnh ${label} lên thành công!`,
        });
      }
    } catch (err) {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || "Tải ảnh thất bại. Chỉ chấp nhận JPG/PNG/WebP dưới 10MB.",
        });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAmountChange = (index, value) => {
    const parsed = parseFloat(value);
    setBomItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, actualAmount: isNaN(parsed) ? 0 : parsed } : item
      )
    );
  };

  const handleRemoveItem = (index) => {
    setBomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddChemical = ({ productId, amount }) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setBomItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        unit: prod.unit || "ml",
        standardAmount: 0,
        actualAmount: amount,
      },
    ]);
    setIsAddChemicalOpen(false);
  };

  const handleSave = () => {
    const payload = {
      technicianId: technicianId ? Number(technicianId) : null,
      beforeImageUrl: beforeImageUrl || null,
      afterImageUrl: afterImageUrl || null,
      formulaNotes: formulaNotes || null,
      hairConditionNotes: hairConditionNotes || null,
      consumptions: bomItems.map((item) => ({
        productId: item.productId,
        actualAmount: Number(item.actualAmount) || 0,
      })),
    };
    saveMutation.mutate(payload);
  };

  return {
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
  };
}
