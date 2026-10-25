import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../api/analyticsApi";
import { QUERY_KEYS } from "../../lib/queryKeys";
import { toLocalDateISO, shiftLocalDateISO } from "../../lib/utils";

export const PAYROLL_PERIOD_PRESETS = {
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  LAST_7_DAYS: "LAST_7_DAYS",
  CUSTOM: "CUSTOM",
};

export function computePresetDates(preset) {
  const now = new Date();
  const today = toLocalDateISO(now);

  switch (preset) {
    case PAYROLL_PERIOD_PRESETS.THIS_MONTH: {
      const firstDay = toLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
      return { startDate: firstDay, endDate: today };
    }
    case PAYROLL_PERIOD_PRESETS.LAST_MONTH: {
      const firstDayLastMonth = toLocalDateISO(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const lastDayLastMonth = toLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 0));
      return { startDate: firstDayLastMonth, endDate: lastDayLastMonth };
    }
    case PAYROLL_PERIOD_PRESETS.LAST_7_DAYS: {
      const sevenDaysAgo = shiftLocalDateISO(today, -6);
      return { startDate: sevenDaysAgo, endDate: today };
    }
    default:
      return { startDate: "", endDate: "" };
  }
}

/**
 * Custom hook for managing Personal Payroll Statement state, period presets, and query.
 */
export function useMyPayroll({ initialPreset = PAYROLL_PERIOD_PRESETS.THIS_MONTH, enabled = true } = {}) {
  const [preset, setPreset] = useState(initialPreset);
  const [{ startDate, endDate }, setDates] = useState(() => computePresetDates(initialPreset));

  const selectPreset = useCallback((newPreset) => {
    setPreset(newPreset);
    if (newPreset !== PAYROLL_PERIOD_PRESETS.CUSTOM) {
      const computed = computePresetDates(newPreset);
      setDates(computed);
    }
  }, []);

  const setCustomStartDate = useCallback((newStart) => {
    setPreset(PAYROLL_PERIOD_PRESETS.CUSTOM);
    setDates((prev) => ({ ...prev, startDate: newStart }));
  }, []);

  const setCustomEndDate = useCallback((newEnd) => {
    setPreset(PAYROLL_PERIOD_PRESETS.CUSTOM);
    setDates((prev) => ({ ...prev, endDate: newEnd }));
  }, []);

  const query = useQuery({
    queryKey: [QUERY_KEYS.myPayroll[0], startDate, endDate],
    queryFn: () => analyticsApi.getMyPayrollReport(startDate || undefined, endDate || undefined),
    enabled: Boolean(enabled),
    staleTime: 30000,
  });

  return {
    ...query,
    payroll: query.data,
    preset,
    startDate,
    endDate,
    selectPreset,
    setCustomStartDate,
    setCustomEndDate,
  };
}
