import React, { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  Star, 
  Scissors, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Camera,
  MessageSquare
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { VisualLogCard } from "./VisualLogCard";

export function CustomerOrderCard({ order, onOpenReview }) {
  const [showVisualLog, setShowVisualLog] = useState(Boolean(order.visualLog));

  const items = order.items || [];
  const primaryStylist = order.primaryStylist;
  const review = order.review;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm space-y-4 hover:border-pink-200 transition-colors">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-extrabold text-sm text-slate-900">
              #{order.orderCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ĐÃ THANH TOÁN</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {order.createdAt ? formatDate(order.createdAt) : "Hoàn thành"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {order.branchName}
            </span>
          </div>
        </div>

        {/* Amount Paid */}
        <div className="text-left sm:text-right">
          <div className="text-xs text-slate-400 font-medium">Thực thanh toán</div>
          <div className="text-base font-black text-pink-600 font-mono">
            {formatCurrency(order.finalAmount ?? order.netRevenue ?? 0)}
          </div>
          {order.discountAmount > 0 && (
            <div className="text-[10px] text-emerald-600 font-semibold">
              Tiết kiệm: -{formatCurrency(order.discountAmount)}
            </div>
          )}
        </div>
      </div>

      {/* Services List & Stylist */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1.5">
          <div className="font-bold text-slate-700">Dịch vụ & Sản phẩm:</div>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">• {item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                <span className="font-mono font-semibold shrink-0">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participating Stylists */}
        <div className="space-y-1.5">
          <div className="font-bold text-slate-700 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-pink-500" />
            <span>Chuyên viên tạo mẫu (Stylist):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {primaryStylist ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold">
                <span>{primaryStylist.fullName}</span>
                <span className="text-[10px] text-pink-500 font-medium">(Chính)</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">Đội ngũ kỹ thuật viên chi nhánh</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Log Section */}
      {order.visualLog && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowVisualLog((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{showVisualLog ? "Ẩn hồ sơ Visual Log" : "Xem hồ sơ Visual Log (Trước/Sau & Công thức)"}</span>
            {showVisualLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showVisualLog && <VisualLogCard visualLog={order.visualLog} />}
        </div>
      )}

      {/* Review Section */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {review ? (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 w-full space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                ))}
                <span className="font-bold text-amber-800 ml-1.5">{review.rating}.0 sao</span>
              </div>
              <span className="text-[10px] text-slate-400">Đã đánh giá</span>
            </div>
            {review.comment && (
              <p className="text-slate-700 text-xs italic">"{review.comment}"</p>
            )}
            <div className="text-[10px] text-slate-500">
              Stylist: <span className="font-bold text-slate-700">{review.stylistName}</span>
            </div>
          </div>
        ) : order.canReview ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-pink-500" />
              <span>Bạn thấy trải nghiệm làm đẹp thế nào?</span>
            </span>
            <Button
              type="button"
              onClick={() => onOpenReview(order)}
              className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs gap-1.5"
            >
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Đánh giá dịch vụ</span>
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Đơn hàng bán lẻ không áp dụng đánh giá dịch vụ
          </div>
        )}
      </div>
    </div>
  );
}
