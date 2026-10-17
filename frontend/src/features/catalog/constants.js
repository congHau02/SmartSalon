// Standard preset service categories
export const PRESET_CATEGORIES = [
  "Cắt tóc & Tạo kiểu",
  "Uốn - Nhuộm",
  "Gội dưỡng sinh & Spa",
  "Phục hồi",
];

// Presets for technical step commission splits to save time for managers
export const STEP_TEMPLATES = [
  {
    name: "Cắt & Sấy cơ bản",
    steps: [
      { stepName: "Cắt tạo kiểu chính", stepOrder: 1, commissionRate: 20 },
      { stepName: "Gội xả & Sấy hoàn thiện", stepOrder: 2, commissionRate: 10 },
    ],
  },
  {
    name: "Uốn / Nhuộm 3 bước",
    steps: [
      { stepName: "Pha chế & Vào hoá chất", stepOrder: 1, commissionRate: 15 },
      { stepName: "Lên trục / Canh nhiệt", stepOrder: 2, commissionRate: 15 },
      { stepName: "Xả thuốc & Sấy tạo kiểu", stepOrder: 3, commissionRate: 10 },
    ],
  },
  {
    name: "Gội dưỡng sinh & Massage",
    steps: [
      { stepName: "Khai thông huyệt đạo & Rửa mặt", stepOrder: 1, commissionRate: 15 },
      { stepName: "Gội thảo dược & Massage cổ vai gáy", stepOrder: 2, commissionRate: 20 },
    ],
  },
];
