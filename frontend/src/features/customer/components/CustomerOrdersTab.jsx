import React, { useState } from "react";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useCustomerOrders, useSubmitServiceReview } from "../useCustomer";
import { CustomerOrderCard } from "./CustomerOrderCard";
import { ServiceReviewModal } from "./ServiceReviewModal";
import { Button } from "../../../components/ui/Button";

export function CustomerOrdersTab() {
  const { data: orders = [], isLoading, isError, error, refetch } = useCustomerOrders();
  const submitReviewMutation = useSubmitServiceReview();
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);

  const handleReviewSubmit = async (payload) => {
    if (!selectedOrderForReview) return;
    try {
      await submitReviewMutation.mutateAsync({
        orderId: selectedOrderForReview.orderId,
        payload,
      });
      setSelectedOrderForReview(null);
    } catch (err) {
      // Mutation error handled or displayed in modal
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-slate-100 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-100 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-xs text-rose-600 font-medium">
          {error?.response?.data?.message || "Không thể tải lịch sử làm đẹp. Vui lòng thử lại."}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="text-xs font-bold gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-pink-200">
          <Camera className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-extrabold text-slate-900">
            Chưa có lịch sử làm đẹp
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn chưa hoàn thành dịch vụ nào tại SmartSalon. Sau khi thanh toán hóa đơn làm đẹp tại quầy, hồ sơ kỹ thuật và ảnh Trước/Sau (Visual Log) sẽ tự động xuất hiện tại đây.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Đặt lịch ngay để trải nghiệm dịch vụ tạo mẫu tóc chuyên nghiệp!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <CustomerOrderCard
          key={order.orderId}
          order={order}
          onOpenReview={(ord) => setSelectedOrderForReview(ord)}
        />
      ))}

      <ServiceReviewModal
        isOpen={Boolean(selectedOrderForReview)}
        onClose={() => setSelectedOrderForReview(null)}
        order={selectedOrderForReview}
        onSubmit={handleReviewSubmit}
        isSubmitting={submitReviewMutation.isPending}
      />
    </div>
  );
}
