import React, { useState, useEffect, useCallback, useMemo } from "react";
import { axiosClient } from "../../api/axiosClient";
import { useAuth } from "../auth/useAuth";
import { BranchContext } from "./context";

const STORAGE_KEY = "smartsalon_active_branch_id";

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [error, setError] = useState(null);

  // Check if current user is allowed to switch active branch context (ADMIN, MANAGER)
  const canSwitchBranch = useMemo(() => {
    if (!user) return false;
    const roles = user.roles || [];
    return roles.includes("ADMIN") || roles.includes("MANAGER");
  }, [user]);

  useEffect(() => {
    let ignore = false;

    async function loadBranches() {
      setIsLoadingBranches(true);
      setError(null);
      try {
        const response = await axiosClient.get("/api/v1/branches");
        if (ignore) return;

        // Backend ApiResponse wraps payload in `result` (or unwrapped in data)
        const branchList = response?.result || response?.data || [];
        setBranches(branchList);

        // If user is locked to an assigned branch (e.g., STAFF), enforce user.branchId
        if (!canSwitchBranch && user?.branchId) {
          setSelectedBranchIdState(user.branchId);
          localStorage.setItem(STORAGE_KEY, user.branchId.toString());
          return;
        }

        // For ADMIN or MANAGER: restore from saved, fallback to user.branchId, then first branch
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedId = saved ? Number(saved) : null;

        if (savedId && branchList.some((b) => b.id === savedId)) {
          setSelectedBranchIdState(savedId);
        } else if (user?.branchId && branchList.some((b) => b.id === user.branchId)) {
          localStorage.setItem(STORAGE_KEY, user.branchId.toString());
          setSelectedBranchIdState(user.branchId);
        } else if (branchList.length > 0) {
          localStorage.setItem(STORAGE_KEY, branchList[0].id.toString());
          setSelectedBranchIdState(branchList[0].id);
        }
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.message || err?.message || "Không thể tải danh sách chi nhánh");
      } finally {
        if (!ignore) {
          setIsLoadingBranches(false);
        }
      }
    }

    loadBranches();
    return () => {
      ignore = true;
    };
  }, [user, canSwitchBranch]);

  const setSelectedBranchId = useCallback((id) => {
    if (!canSwitchBranch) {
      return;
    }
    const numId = Number(id);
    setSelectedBranchIdState(numId);
    if (numId) {
      localStorage.setItem(STORAGE_KEY, numId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [canSwitchBranch]);

  const selectedBranch = useMemo(() => {
    if (!branches.length) return null;
    return branches.find((b) => b.id === selectedBranchId) || branches[0] || null;
  }, [branches, selectedBranchId]);

  const value = useMemo(
    () => ({
      branches,
      selectedBranch,
      selectedBranchId,
      setSelectedBranchId,
      isLoadingBranches,
      canSwitchBranch,
      error,
    }),
    [branches, selectedBranch, selectedBranchId, setSelectedBranchId, isLoadingBranches, canSwitchBranch, error]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}
