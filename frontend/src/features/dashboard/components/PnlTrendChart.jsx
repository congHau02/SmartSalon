import React, { useState } from "react";
import { formatCurrency } from "../../../lib/utils";
import { BarChart3, TrendingUp } from "lucide-react";
import { PnlChartTooltip } from "./PnlChartTooltip";

export function PnlTrendChart({ dailySeries = [], isLoading }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!dailySeries || dailySeries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-700">Chưa có dữ liệu xu hướng theo ngày</h3>
        <p className="text-xs text-slate-400 mt-1">
          Không có đơn hàng đã thanh toán trong khoảng thời gian đã chọn.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...dailySeries.map((d) => Math.max(d.totalNetRevenue || 0, (d.chemicalCogs || 0) + (d.retailCogs || 0) + (d.totalCommissions || 0))),
    1000000
  );

  const chartHeight = 220;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 30;
  const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

  const hoveredData = hoveredIdx !== null ? dailySeries[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Biểu đồ Xu hướng Doanh thu, Chi phí & Lợi nhuận theo Ngày
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh trực quan Doanh thu thuần vs. Tổng chi phí (COGS + Hoa hồng) vs. Lợi nhuận vận hành
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
            <span className="text-slate-600 font-medium">Doanh thu thuần</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
            <span className="text-slate-600 font-medium">Chi phí (COGS + Hoa hồng)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-600 font-medium">Lợi nhuận vận hành</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative">
        <PnlChartTooltip hoveredData={hoveredData} />

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <svg
            className="w-full"
            style={{ minWidth: `${Math.max(dailySeries.length * 70, 480)}px`, height: `${chartHeight}px` }}
            viewBox={`0 0 ${Math.max(dailySeries.length * 70, 480)} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = chartPaddingTop + usableHeight * (1 - pct);
              return (
                <g key={idx}>
                  <line
                    x1="0"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray={pct === 0 ? "none" : "3,3"}
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y={y - 4}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {formatCurrency(maxVal * pct)}
                  </text>
                </g>
              );
            })}

            {/* Bars for each day */}
            {dailySeries.map((d, idx) => {
              const totalNet = d.totalNetRevenue || 0;
              const totalCost = (d.chemicalCogs || 0) + (d.retailCogs || 0) + (d.totalCommissions || 0);
              const opProfit = d.operationalNetProfit || 0;

              const totalWidth = Math.max(dailySeries.length * 70, 480);
              const colWidth = totalWidth / dailySeries.length;
              const groupCenterX = idx * colWidth + colWidth / 2;
              const barWidth = Math.min(colWidth * 0.22, 16);

              const revHeight = (totalNet / maxVal) * usableHeight;
              const revY = chartPaddingTop + usableHeight - revHeight;

              const costHeight = (totalCost / maxVal) * usableHeight;
              const costY = chartPaddingTop + usableHeight - costHeight;

              const profitHeight = (Math.max(0, opProfit) / maxVal) * usableHeight;
              const profitY = chartPaddingTop + usableHeight - profitHeight;

              const isHovered = hoveredIdx === idx;
              const dateStr = d.date ? d.date.split("-").slice(1).reverse().join("/") : "";

              return (
                <g
                  key={d.date || idx}
                  className="cursor-pointer transition-opacity duration-150 outline-none"
                  tabIndex={0}
                  role="img"
                  aria-label={`Ngày ${dateStr}: doanh thu ${totalNet.toLocaleString("vi-VN")} đồng, chi phí ${totalCost.toLocaleString("vi-VN")} đồng, lợi nhuận ${opProfit.toLocaleString("vi-VN")} đồng`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx)}
                >
                  {isHovered && (
                    <rect
                      x={idx * colWidth + 2}
                      y={chartPaddingTop}
                      width={colWidth - 4}
                      height={usableHeight}
                      fill="#f8fafc"
                      rx="6"
                    />
                  )}

                  <rect
                    x={groupCenterX - barWidth * 1.6}
                    y={revY}
                    width={barWidth}
                    height={Math.max(revHeight, 2)}
                    fill={isHovered ? "#2563eb" : "#3b82f6"}
                    rx="3"
                  />

                  <rect
                    x={groupCenterX - barWidth * 0.5}
                    y={costY}
                    width={barWidth}
                    height={Math.max(costHeight, 2)}
                    fill={isHovered ? "#d97706" : "#fbbf24"}
                    rx="3"
                  />

                  <rect
                    x={groupCenterX + barWidth * 0.6}
                    y={profitY}
                    width={barWidth}
                    height={Math.max(profitHeight, 2)}
                    fill={isHovered ? "#059669" : "#10b981"}
                    rx="3"
                  />

                  <text
                    x={groupCenterX}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill={isHovered ? "#0f172a" : "#64748b"}
                    fontWeight={isHovered ? "bold" : "normal"}
                    fontSize="10"
                  >
                    {dateStr}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
