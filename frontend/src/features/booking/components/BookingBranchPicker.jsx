import React, { useState } from "react";
import { Navigation, Loader2, AlertCircle } from "lucide-react";
import { BranchCardItem } from "./BranchCardItem";
import { BranchMap } from "./BranchMap";
import { calculateHaversineDistanceKm, findClosestBranch } from "../geoUtils";

export function BookingBranchPicker({
  isLoadingBranches,
  branches = [],
  selectedBranchId,
  onSelectBranch,
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [distances, setDistances] = useState({});

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị vị trí.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const newDistances = {};
        branches.forEach((b) => {
          if (b.latitude && b.longitude) {
            const dist = calculateHaversineDistanceKm(
              userCoords.latitude,
              userCoords.longitude,
              b.latitude,
              b.longitude
            );
            if (dist !== null) {
              newDistances[b.id] = dist;
            }
          }
        });
        setDistances(newDistances);

        const closest = findClosestBranch(userCoords, branches);
        if (closest?.branch?.id) {
          onSelectBranch(closest.branch.id);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError("Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chọn Chi nhánh Salon</h3>
            <p className="text-xs text-slate-500">
              Vui lòng chọn salon gần nhất để xem lịch trống của Stylist
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFindNearMe}
          disabled={isLocating || isLoadingBranches}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 rotate-45 text-pink-600" />
          )}
          <span>{isLocating ? "Đang xác định vị trí..." : "Gần tôi nhất"}</span>
        </button>
      </div>

      {locationError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {isLoadingBranches ? (
        <div className="grid md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 items-start">
          {/* Left Column: Branch Cards List */}
          <div className="space-y-3">
            {branches.map((b) => (
              <BranchCardItem
                key={b.id}
                branch={b}
                isSelected={selectedBranchId === b.id}
                distanceKm={distances[b.id]}
                onSelect={() => onSelectBranch(b.id)}
              />
            ))}
          </div>

          {/* Right Column: Interactive Leaflet Map */}
          <div>
            <BranchMap
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={onSelectBranch}
              distances={distances}
            />
          </div>
        </div>
      )}
    </div>
  );
}
