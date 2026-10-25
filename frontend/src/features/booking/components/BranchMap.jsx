import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getGoogleMapsDirectionsUrl } from "../geoUtils";

function createPinIcon(isSelected = false) {
  const bg = isSelected ? "#db2777" : "#0f172a";
  const size = isSelected ? 36 : 28;
  const iconSize = isSelected ? 16 : 12;

  return L.divIcon({
    className: "custom-salon-marker",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;
        background:${bg};border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 8px rgba(0,0,0,0.35);
        border:2px solid #ffffff;cursor:pointer;
        transition:all 0.25s ease;
      ">
        <svg style="transform:rotate(45deg);width:${iconSize}px;height:${iconSize}px;fill:none;stroke:#ffffff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function BranchMap({
  branches = [],
  selectedBranchId,
  onSelectBranch,
  distances = {},
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = [10.7769, 106.7009]; // TP. Hồ Chí Minh
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when branches or distances change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const validBranches = branches.filter((b) => b.latitude && b.longitude);

    validBranches.forEach((b) => {
      const isSelected = b.id === selectedBranchId;
      const marker = L.marker([Number(b.latitude), Number(b.longitude)], {
        icon: createPinIcon(isSelected),
      }).addTo(map);

      const distanceText = distances[b.id] ? `Cách bạn ${distances[b.id]} km` : "";
      const dirUrl = getGoogleMapsDirectionsUrl(b.latitude, b.longitude);

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 190px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${b.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">${b.address}</div>
          ${b.phone ? `<div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">${b.phone}</div>` : ""}
          ${distanceText ? `<div style="display:inline-block;padding:2px 6px;background:#fce7f3;color:#be185d;border-radius:6px;font-size:10px;font-weight:700;margin-bottom:6px;">${distanceText}</div>` : ""}
          <div style="display:flex;gap:6px;margin-top:6px;">
            <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:4px 8px;background:#0f172a;color:#ffffff;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">Chỉ đường</a>
            <button id="select-branch-${b.id}" style="padding:4px 8px;background:#ec4899;color:#ffffff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Chọn salon</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelectBranch(b.id);
      });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`select-branch-${b.id}`);
        if (btn) {
          btn.onclick = () => onSelectBranch(b.id);
        }
      });

      markersRef.current[b.id] = marker;
    });
  }, [branches, distances, onSelectBranch]);

  // Synchronize selection: flyTo and open popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBranchId) return;

    const selectedBranch = branches.find((b) => b.id === selectedBranchId);
    if (!selectedBranch?.latitude || !selectedBranch?.longitude) return;

    map.flyTo(
      [Number(selectedBranch.latitude), Number(selectedBranch.longitude)],
      15,
      { duration: 1.0 }
    );

    // Update marker icons and open popup
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isSel = Number(id) === Number(selectedBranchId);
      marker.setIcon(createPinIcon(isSel));
      if (isSel) {
        marker.openPopup();
      }
    });
  }, [selectedBranchId, branches]);

  return (
    <div className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
