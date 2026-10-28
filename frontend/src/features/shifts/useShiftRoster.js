import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shiftApi } from "../../api/shiftApi";
import { useBranch } from "../branch/useBranch";
import { QUERY_KEYS } from "../../lib/queryKeys";

function getMondayOfDate(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useShiftRoster() {
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;
  const queryClient = useQueryClient();

  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfDate(new Date()));
  const [conflictData, setConflictData] = useState(null);
  const [templateModalData, setTemplateModalData] = useState(null);

  const startDate = useMemo(() => toDateString(currentMonday), [currentMonday]);
  const endDate = useMemo(() => {
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    return toDateString(end);
  }, [currentMonday]);

  const prevMondayStr = useMemo(() => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    return toDateString(prev);
  }, [currentMonday]);

  const goToNextWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const goToPrevWeek = () => {
    setCurrentMonday((prev) => {
      const p = new Date(prev);
      p.setDate(p.getDate() - 7);
      return p;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentMonday(getMondayOfDate(new Date()));
  };

  // 1. Fetch shift templates
  const {
    data: templates = [],
    isLoading: isTemplatesLoading,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: QUERY_KEYS.shiftTemplates(branchId),
    queryFn: () => shiftApi.getTemplates(branchId),
    enabled: !!branchId,
  });

  // 2. Fetch weekly roster
  const {
    data: rosterData,
    isLoading: isRosterLoading,
    isFetching: isRosterFetching,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: QUERY_KEYS.shiftRoster(branchId, startDate, endDate),
    queryFn: () => shiftApi.getWeeklyRoster(branchId, startDate, endDate),
    enabled: !!branchId && !!startDate,
  });

  // 3. Update single cell mutation
  const updateCellMutation = useMutation({
    mutationFn: (cell) =>
      shiftApi.updateRoster({
        branchId,
        cells: [cell],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shiftRoster(branchId) });
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        const errorResult = err.response?.data?.result || [];
        const message = err.response?.data?.message || "Xung Ä‘á»™t lá»‹ch háº¹n cá»§a Stylist";
        setConflictData({ bookings: errorResult, message });
      }
    },
  });

  // 4. Copy week mutation
  const copyWeekMutation = useMutation({
    mutationFn: () =>
      shiftApi.copyWeekRoster({
        branchId,
        sourceStartDate: prevMondayStr,
        targetStartDate: startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shiftRoster(branchId) });
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        const errorResult = err.response?.data?.result || [];
        const message = err.response?.data?.message || "Xung Ä‘á»™t lá»‹ch háº¹n khi sao chÃ©p tuáº§n";
        setConflictData({ bookings: errorResult, message });
      }
    },
  });

  // 5. Template mutation (create or update)
  const saveTemplateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? shiftApi.updateTemplate(id, data) : shiftApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shiftTemplates(branchId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shiftRoster(branchId) });
      setTemplateModalData(null);
    },
  });

  const updateCell = (userId, scheduleDate, status, shiftTemplateId, notes) => {
    updateCellMutation.mutate({
      userId,
      scheduleDate,
      status,
      shiftTemplateId: status === "WORKING" ? shiftTemplateId : null,
      notes,
    });
  };

  return {
    branchId,
    selectedBranch,
    startDate,
    endDate,
    prevMondayStr,
    templates,
    rosterData,
    isLoading: isTemplatesLoading || isRosterLoading,
    isUpdating: updateCellMutation.isPending || copyWeekMutation.isPending,
    isRosterFetching,
    conflictData,
    closeConflictModal: () => setConflictData(null),
    templateModalData,
    openTemplateModal: (data = null) => setTemplateModalData(data || { branchId, isActive: true }),
    closeTemplateModal: () => setTemplateModalData(null),
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    updateCell,
    copyWeek: copyWeekMutation.mutate,
    saveTemplate: saveTemplateMutation.mutate,
    refetchRoster,
    refetchTemplates,
  };
}
