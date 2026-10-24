import React, { useState, useEffect } from "react";
import { Star, X, Scissors, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function ServiceReviewModal({ isOpen, onClose, order, onSubmit, isSubmitting }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [stylistId, setStylistId] = useState(null);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (order) {
      setRating(5);
      setComment("");
      setErrorMsg("");
      const defaultStylist = order.primaryStylist?.id || order.participatingStylists?.[0]?.id || null;
      setStylistId(defaultStylist);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg("Vui lòng chọn từ 1 đến 5 sao");
      return;
    }
    onSubmit({
      stylistId: stylistId ? Number(stylistId) : undefined,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const stylists = order.participatingStylists || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-pink-100 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Đánh giá dịch vụ & Stylist</h3>
            <p className="text-xs text-slate-500">Đơn hàng #{order.orderCode} • {order.branchName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div className="text-center py-2 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mức độ hài lòng của bạn
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-xl transition-transform hover:scale-110 cursor-pointer focus:outline-hidden"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-600">
              {rating === 5 && "Tuyệt vời! Hoàn toàn hài lòng"}
              {rating === 4 && "Rất tốt! Hài lòng với dịch vụ"}
              {rating === 3 && "Bình thường / Tạm ổn"}
              {rating === 2 && "Chưa hài lòng"}
              {rating === 1 && "Trải nghiệm kém"}
            </p>
          </div>

          {/* Stylist Selector */}
          {stylists.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-pink-500" />
                <span>Kỹ thuật viên phục vụ chính</span>
              </label>
              <select
                value={stylistId || ""}
                onChange={(e) => setStylistId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-pink-500 focus:outline-hidden"
              >
                {stylists.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} {st.id === order.primaryStylist?.id ? "(Stylist chính)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Comment textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
              <span>Lời nhận xét & Góp ý (tùy chọn)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận về kiểu tóc, màu nhuộm, tay nghề của chuyên viên..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-pink-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
