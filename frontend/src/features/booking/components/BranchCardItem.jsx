import React from "react";
import { MapPin, Phone, Check, Navigation } from "lucide-react";
import { getGoogleMapsDirectionsUrl } from "../geoUtils";

export function BranchCardItem({
  branch,
  isSelected,
  distanceKm,
  onSelect,
}) {
  const directionsUrl = getGoogleMapsDirectionsUrl(branch.latitude, branch.longitude);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
        isSelected
          ? "border-pink-500 bg-pink-50/40 shadow-xs ring-2 ring-pink-100"
          : "border-slate-200 bg-white hover:border-pink-200 hover:shadow-xs"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-base">{branch.name}</h4>
            <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{branch.address}</span>
            </p>
          </div>
          {isSelected && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          )}
        </div>

        {distanceKm != null && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
              <Navigation className="w-3 h-3 rotate-45" />
              <span>Cách bạn {distanceKm} km</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          {branch.phone && (
            <>
              <Phone className="w-3 h-3 text-pink-500" />
              <span>{branch.phone}</span>
            </>
          )}
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          title="Mở chỉ đường Google Maps"
        >
          <Navigation className="w-3 h-3 text-slate-600" />
          <span>Chỉ đường</span>
        </a>
      </div>
    </div>
  );
}
