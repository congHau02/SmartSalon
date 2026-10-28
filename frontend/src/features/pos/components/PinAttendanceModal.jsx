import React, { useState, useEffect } from "react";
import { X, Clock, ShieldCheck, User, Coffee, LogOut, AlertOctagon, CheckCircle2 } from "lucide-react";
import { PinPad } from "./PinPad";
import { useTodayAttendance, useAttendanceAction } from "../usePosQueries";
import { ATTENDANCE_ACTIONS, getAttendanceBadge, getShiftBadgeClasses } from "../attendance.constants";

export function PinAttendanceModal({
  isOpen,
  onClose,
  branchId,
  initialStaff = null,
  userRoles = [],
  onSuccess,
}) {
  const { data: attendanceList = [], isLoading } = useTodayAttendance(branchId, { enabled: isOpen });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(ATTENDANCE_ACTIONS.CLOCK_IN);
  const [pin, setPin] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const isPrivileged = userRoles.some((r) =>
    ["ADMIN", "ROLE_ADMIN", "MANAGER", "ROLE_MANAGER", "STAFF", "ROLE_STAFF"].includes(r)
  );

  useEffect(() => {
    if (!isOpen) {
      setPin("");
      setErrorMessage(null);
      setIsOverride(false);
      return;
    }
    if (initialStaff?.userId || initialStaff?.stylistId) {
      setSelectedUserId(initialStaff.userId || initialStaff.stylistId);
    } else if (attendanceList.length > 0 && !selectedUserId) {
      setSelectedUserId(attendanceList[0].userId);
    }
  }, [isOpen, initialStaff, attendanceList]);

  const currentStaff = attendanceList.find((s) => s.userId === selectedUserId) || initialStaff;
  const currentStatus = currentStaff?.attendanceStatus;

  // Set default sensible action based on current status
  useEffect(() => {
    if (currentStatus === "PRESENT") {
      setSelectedAction(ATTENDANCE_ACTIONS.TOGGLE_BREAK);
    } else if (currentStatus === "ON_BREAK") {
      setSelectedAction(ATTENDANCE_ACTIONS.TOGGLE_BREAK);
    } else {
      setSelectedAction(ATTENDANCE_ACTIONS.CLOCK_IN);
    }
  }, [currentStatus]);

  const mutation = useAttendanceAction({
    branchId,
    onSuccess: (data) => {
      onSuccess?.(data);
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || "Mã PIN không hợp lệ hoặc thao tác bị từ chối");
      setPin("");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (submittedPin = pin) => {
    if (!selectedUserId) return;
    setErrorMessage(null);
    mutation.mutate({
      branchId,
      userId: selectedUserId,
      action: selectedAction,
      pin: isOverride ? undefined : submittedPin,
      overridePin: isOverride,
    });
  };

  const statusBadge = getAttendanceBadge(currentStatus, currentStaff?.isWorking);
  const shiftBadgeClass = getShiftBadgeClasses(currentStaff?.shiftCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-slate-100">Chấm công 1-Touch PIN</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Staff Selector & Profile */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
          {attendanceList.length > 1 ? (
            <select
              value={selectedUserId || ""}
              onChange={(e) => {
                setSelectedUserId(Number(e.target.value));
                setPin("");
                setErrorMessage(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-pink-500"
            >
              {attendanceList.map((s) => (
                <option key={s.userId} value={s.userId}>
                  {s.fullName} ({s.shiftName || "Chưa xếp ca"})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span>{currentStaff?.fullName || "Nhân viên"}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${shiftBadgeClass}`}>
              {currentStaff?.shiftName || "Ca Cả ngày"}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusBadge.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => { setSelectedAction(ATTENDANCE_ACTIONS.CLOCK_IN); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedAction === ATTENDANCE_ACTIONS.CLOCK_IN
                ? "bg-emerald-600 border-emerald-500 text-white"
                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vào ca (Clock-in)</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedAction(ATTENDANCE_ACTIONS.TOGGLE_BREAK); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedAction === ATTENDANCE_ACTIONS.TOGGLE_BREAK
                ? "bg-amber-600 border-amber-500 text-white"
                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{currentStatus === "ON_BREAK" ? "Tiếp tục ca" : "Tạm nghỉ"}</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedAction(ATTENDANCE_ACTIONS.CLOCK_OUT); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedAction === ATTENDANCE_ACTIONS.CLOCK_OUT
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Tan ca (Clock-out)</span>
          </button>
          {isPrivileged && (
            <button
              type="button"
              onClick={() => { setSelectedAction(ATTENDANCE_ACTIONS.MARK_ABSENT); setErrorMessage(null); }}
              className={`py-2 px-2.5 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                selectedAction === ATTENDANCE_ACTIONS.MARK_ABSENT
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Vắng mặt (Absent)</span>
            </button>
          )}
        </div>

        {/* Admin/Manager Override Toggle */}
        {isPrivileged && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => { setIsOverride(e.target.checked); setErrorMessage(null); }}
              className="rounded bg-slate-800 border-slate-700 text-pink-500 focus:ring-0"
            />
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>Ghi đè quản trị (Không cần mã PIN)</span>
          </label>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* PIN Pad or Direct Submit */}
        {isOverride ? (
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => handleSubmit()}
            className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold text-xs hover:from-pink-600 hover:to-rose-700 transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận ghi đè"}
          </button>
        ) : (
          <PinPad
            pin={pin}
            onChange={setPin}
            onComplete={(fullPin) => handleSubmit(fullPin)}
            disabled={mutation.isPending}
            isError={Boolean(errorMessage)}
          />
        )}
      </div>
    </div>
  );
}
