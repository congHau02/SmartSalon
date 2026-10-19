import { useState, useCallback } from "react";
import { analyticsApi } from "../../../api/analyticsApi";

/**
 * Shared export state/handler for dashboard tabs.
 * Tracks which format is currently exporting and a dismissible status banner.
 */
export function useReportExport({ reportType, branchId, startDate, endDate }) {
  const [exportingFormat, setExportingFormat] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);

  const clearExportStatus = useCallback(() => setExportStatus(null), []);

  const exportReport = useCallback(
    async (format) => {
      setExportingFormat(format);
      setExportStatus(null);
      try {
        const res = await analyticsApi.exportReport(reportType, format, branchId, startDate, endDate);
        setExportStatus({
          type: "success",
          message: `Đã tải về thành công báo cáo ${format.toUpperCase()}: ${res.filename}`,
        });
        setTimeout(() => setExportStatus(null), 5000);
      } catch (err) {
        setExportStatus({
          type: "error",
          message:
            err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi tạo báo cáo từ máy chủ.",
        });
      } finally {
        setExportingFormat(null);
      }
    },
    [reportType, branchId, startDate, endDate]
  );

  return {
    exportingXlsx: exportingFormat === "xlsx",
    exportingPdf: exportingFormat === "pdf",
    exportStatus,
    clearExportStatus,
    exportReport,
  };
}
