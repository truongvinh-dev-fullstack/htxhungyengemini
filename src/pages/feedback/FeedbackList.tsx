import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CustomerFeedback } from '../../types';

export const FeedbackList: React.FC = () => {
  const {
    feedbacks,
    orders,
    harvests,
    currentHTX,
    currentRole,
    addCustomerFeedback,
    resolveCustomerFeedback,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'cho_xu_ly' | 'da_giai_quyet'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);

  // Modal xử lý phản hồi
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolveStatus, setResolveStatus] = useState<'dang_xu_ly' | 'da_giai_quyet'>('da_giai_quyet');

  // Modal thêm phản hồi mới
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [orderCode, setOrderCode] = useState<string>('');

  const htxFeedbacks = feedbacks.filter((f) => f.htxId === currentHTX.id);

  const filteredFeedbacks = htxFeedbacks.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'cho_xu_ly') return f.status === 'cho_xu_ly' || f.status === 'dang_xu_ly';
    if (activeFilter === 'da_giai_quyet') return f.status === 'da_giai_quyet';
    return true;
  });

  const handleOpenResolveModal = (fb: CustomerFeedback) => {
    setSelectedFeedback(fb);
    setResolutionNotes(fb.resolutionNotes || '');
    setResolveStatus(fb.status === 'dang_xu_ly' ? 'dang_xu_ly' : 'da_giai_quyet');
    setShowResolveModal(true);
  };

  const handleConfirmResolve = () => {
    if (!selectedFeedback) return;
    resolveCustomerFeedback(selectedFeedback.id, resolutionNotes || 'Đã liên hệ xử lý thỏa đáng với khách hàng.', resolveStatus);
    setShowResolveModal(false);
    setSelectedFeedback(null);
  };

  const handleAddNewFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !content) return;

    // Mask phone number
    const raw = customerPhone.replace(/\s+/g, '');
    const masked = raw.length >= 7 ? `${raw.slice(0, 4)}***${raw.slice(-3)}` : '0988***234';

    addCustomerFeedback({
      htxId: currentHTX.id,
      customerName,
      customerPhoneMasked: masked,
      feedbackContent: content,
      rating,
      orderCode: orderCode || undefined,
    });

    setShowAddModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setContent('');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đánh giá & Phản hồi chất lượng"
        voiceText={`Phản hồi và đánh giá từ thương lái, đại lý và khách hàng về chất lượng nông sản ${currentHTX.name}.`}
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Banner Tổng kết */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-3xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
                {currentHTX.shortName} • Dịch vụ sau bán
              </span>
              <h3 className="text-lg font-black mt-0.5">Ý kiến khách hàng & Đối tác</h3>
            </div>
            <span className="text-3xl">⭐</span>
          </div>

          <p className="text-xs text-purple-100 leading-relaxed">
            Gắn liền với từng đơn hàng hoặc lô bán. Số điện thoại được ẩn bảo mật tránh lộ lọt thông tin cá nhân.
          </p>

          {(currentRole === 'R04' || currentRole === 'R02') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-1 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Ghi nhận phản hồi mới
            </button>
          )}
        </div>

        {/* Thanh lọc */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeFilter === 'all' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({htxFeedbacks.length})
          </button>
          <button
            onClick={() => setActiveFilter('cho_xu_ly')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeFilter === 'cho_xu_ly' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cần xử lý
          </button>
          <button
            onClick={() => setActiveFilter('da_giai_quyet')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeFilter === 'da_giai_quyet' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã giải quyết
          </button>
        </div>

        {/* Danh sách phản hồi */}
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
            <span className="text-4xl">🌟</span>
            <p className="text-sm font-bold text-slate-700">Chưa có phản hồi nào</p>
            <p className="text-xs text-slate-500">Các đánh giá mới từ người mua sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-purple-500 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{fb.customerName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      SĐT: {fb.customerPhoneMasked} {fb.orderCode && `• Đơn: ${fb.orderCode}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    {'⭐'.repeat(fb.rating)}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  "{fb.feedbackContent}"
                </p>

                {fb.resolutionNotes && (
                  <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                    <div className="flex items-center justify-between font-bold">
                      <span>✓ Đã xử lý bởi: {fb.resolvedBy || 'HTX'}</span>
                      <span className="text-slate-500 font-normal">{fb.resolvedDate}</span>
                    </div>
                    <p className="text-emerald-900">{fb.resolutionNotes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">📅 Ngày nhận: {fb.feedbackDate}</span>

                  {fb.status !== 'da_giai_quyet' ? (
                    <button
                      onClick={() => handleOpenResolveModal(fb)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-sm active:scale-95 transition-all"
                    >
                      Xử lý phản hồi
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold">✓ Đã giải quyết</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL XỬ LÝ PHẢN HỒI */}
      {showResolveModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Xử lý phản hồi chất lượng</h3>
                <p className="text-xs text-slate-500">{selectedFeedback.customerName}</p>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái giải quyết</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 font-bold bg-white"
                >
                  <option value="dang_xu_ly">⏳ Đang xử lý / Kiểm tra nguồn lô</option>
                  <option value="da_giai_quyet">✓ Đã giải quyết thỏa đáng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung phương án xử lý</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Ghi rõ giải pháp: Đổi hàng, bù trừ công nợ, cải tiến quy cách bảo quản..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmResolve}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-2xl shadow-md"
              >
                💾 Lưu kết quả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM PHẢN HỒI MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewFeedback}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Ghi nhận phản hồi mới</h3>
                <p className="text-xs text-purple-700 font-semibold">{currentHTX.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên khách hàng / Đại lý</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Siêu thị WinMart Times City"
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đánh giá sao</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2.5 rounded-2xl border border-slate-300 font-bold bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 sao)</option>
                    <option value={3}>⭐⭐⭐ (3 sao)</option>
                    <option value={2}>⭐⭐ (2 sao)</option>
                    <option value={1}>⭐ (1 sao)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã đơn hàng liên quan (nếu có)</label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Ví dụ: DH-QT-2026-001"
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung ý kiến phản hồi</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận đánh giá về chất lượng quả, độ ngọt, bao bì hoặc thời gian giao..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-2xl shadow-md"
              >
                💾 Lưu phản hồi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
