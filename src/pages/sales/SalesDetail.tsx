import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SalesOrder } from '../../types';

export const SalesDetail: React.FC = () => {
  const {
    screenParams,
    currentHTX,
    orders,
    handovers,
    currentUser,
    feedbacks,
    cancelOrder,
    updateOrderStatus,
    updateDeliveryProgress,
    currentRole,
    goBack,
    navigateTo,
  } = useApp();
  const initialOrder: SalesOrder = screenParams?.order;
  const order: SalesOrder | undefined = orders.find((o) => o.id === (initialOrder?.id || screenParams?.orderId) && o.htxId === currentHTX.id &&
    (currentRole === 'R02' || currentRole === 'R04' ||
     (currentRole === 'R06' && (o.sellerId === currentUser.id || o.sourceOwnerId === currentUser.id)) ||
     (currentRole === 'R03' && (o.actorId === currentUser.id || o.sellerType === 'htx'))
    ));

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Modal cập nhật giao hàng
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveredQty, setDeliveredQty] = useState(String(order?.deliveredQuantity || order?.quantity || 0));
  const [deliveryNotes, setDeliveryNotes] = useState(order?.deliveryNotes || '');

  // Modal QR Phiếu xuất
  const [showQRModal, setShowQRModal] = useState(false);

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy đơn hàng trong phạm vi quyền hạn của bạn.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const canManageOrder = ['R02', 'R04'].includes(currentRole) ||
    (currentRole === 'R06' && order.sellerId === currentUser.id && order.sellerType === 'ho_dan') ||
    (currentRole === 'R03' && order.actorId === currentUser.id && !!order.onBehalfOfFarmer);
  const sourceHandover = handovers.find((item) => item.id === order.sourceHandoverId && item.htxId === currentHTX.id);

  const handleUpdateStatus = (newStatus: 'Đang giao' | 'Hoàn thành') => {
    updateOrderStatus(order.id, newStatus);
    if (newStatus === 'Đang giao') {

    } else if (newStatus === 'Hoàn thành') {

    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    cancelOrder(order.id, cancelReason.trim());
    setShowCancelModal(false);

  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết đơn hàng"
        voiceText={`Đơn hàng mã ${order.code} của khách hàng ${order.customerName}, tổng giá trị ${order.totalAmount.toLocaleString()} đồng.`}
      />

      <div className="p-4 space-y-4">
        {/* Cancelled Banner if cancelled */}
        {order.status === 'Đã hủy' && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-3xl flex items-start gap-3 text-red-900">
            <span className="text-3xl">🚫</span>
            <div>
              <h4 className="text-base font-extrabold text-red-950">Đơn hàng này đã bị hủy</h4>
              <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                <strong>Lý do hủy:</strong> {order.cancelReason || 'Không có lý do chi tiết'}
              </p>
            </div>
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block">{order.code}</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{order.customerName}</h3>
              <p className="text-xs text-slate-500 font-semibold">{order.customerPhone}</p>
              {order.sellerName && (
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Bên bán: <strong>{order.sellerName}</strong>
                </p>
              )}
              {order.onBehalfOfFarmer && order.actorName && (
                <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold text-indigo-900 flex items-center gap-1">
                    <span>✍️</span>
                    <span>Đơn do Cán bộ {order.actorName} ghi thay cho hộ</span>
                  </div>
                  {order.confirmationMethod && (
                    <div className="text-indigo-800">
                      <strong>Xác nhận: </strong>
                      {order.confirmationMethod === 'truc_tiep'
                        ? 'Trực tiếp tại hộ'
                        : order.confirmationMethod === 'dien_thoai'
                        ? 'Qua điện thoại'
                        : 'Có giấy ủy quyền'}
                      {order.confirmationTime ? ` lúc ${order.confirmationTime.slice(0, 16).replace('T', ' ')}` : ''}
                    </div>
                  )}
                  {order.confirmationNote && (
                    <div className="text-slate-600">
                      <strong>Ghi chú: </strong>{order.confirmationNote}
                    </div>
                  )}
                  {order.isDraft && (
                    <div className="text-amber-800 font-bold">
                      ⏳ Bản nháp - Đang chờ hộ xác nhận (chưa trừ kho vật lý)
                    </div>
                  )}
                </div>
              )}
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                order.status === 'Hoàn thành'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'Đã hủy'
                  ? 'bg-red-100 text-red-800'
                  : order.status === 'Đang giao'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Sản phẩm:</span>
              <span className="font-extrabold text-slate-900">{order.productName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Số lượng:</span>
              <span className="font-bold text-slate-900">
                {order.quantity} {order.unit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Đơn vị xuất:</span>
              <span className="font-bold text-slate-900">{currentHTX.shortName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Ngày lập đơn:</span>
              <span className="font-bold text-slate-900">{order.date}</span>
            </div>
            {sourceHandover && <button type="button" onClick={() => navigateTo('handover_detail', { handoverId: sourceHandover.id })} className="w-full rounded-xl bg-sky-50 border border-sky-200 p-3 text-left text-sm font-bold text-sky-900">
              Phiếu nguồn: {sourceHandover.code} • {sourceHandover.handoverType === 'ky_gui' ? 'HTX bán hộ hàng ký gửi' : 'Hàng HTX mua đứt'} • Chủ hàng: {sourceHandover.senderName}
            </button>}
            {order.invoiceNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Số hóa đơn HĐĐT:</span>
                <span className="font-mono font-bold text-indigo-700">{order.invoiceNumber}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
            <span className="text-sm font-bold text-purple-900">Tổng thanh toán:</span>
            <span className="text-2xl font-extrabold text-purple-950">
              {order.totalAmount.toLocaleString()} đ
            </span>
          </div>
        </div>

        {/* TIẾN ĐỘ GIAO HÀNG & CÔNG NỢ */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🚚</span>
              <span>Giao hàng thực tế & Công nợ</span>
            </h4>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              order.deliveryStatus === 'da_giao'
                ? 'bg-emerald-100 text-emerald-800'
                : order.deliveryStatus === 'dang_giao'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {order.deliveryStatus === 'da_giao' ? '✓ Đã giao xong' : order.deliveryStatus === 'dang_giao' ? 'Đang giao' : 'Chưa giao'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-medium">Đã giao thực tế:</span>
              <strong className="text-sm font-black text-slate-900">
                {order.deliveredQuantity || 0} / {order.quantity} {order.unit}
              </strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-medium">Đã thanh toán:</span>
              <strong className="text-sm font-black text-emerald-700">
                {(order.paidAmount || 0).toLocaleString()} đ
              </strong>
            </div>
          </div>

          {order.remainingDebt !== undefined && order.remainingDebt > 0 && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between items-center text-amber-900">
              <span>Công nợ còn lại:</span>
              <strong className="text-sm font-black">{order.remainingDebt.toLocaleString()} đ</strong>
            </div>
          )}

          {canManageOrder && order.status !== 'Đã hủy' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>📦</span>
                <span>Cập nhật số giao</span>
              </button>

              <button
                onClick={() => setShowQRModal(true)}
                className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>📱</span>
                <span>Mã QR Phiếu xuất</span>
              </button>
            </div>
          )}
        </div>

        {/* PHẢN HỒI CHẤT LƯỢNG CHO ĐƠN HÀNG */}
        {feedbacks.some((f) => f.orderId === order.id || f.orderCode === order.code) && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-2">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>⭐</span>
              <span>Ý kiến phản hồi từ khách mua</span>
            </h4>
            {feedbacks
              .filter((f) => f.orderId === order.id || f.orderCode === order.code)
              .map((fb) => (
                <div key={fb.id} className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{fb.customerName}</span>
                    <span className="text-amber-600">{'⭐'.repeat(fb.rating)}</span>
                  </div>
                  <p className="text-slate-700">"{fb.feedbackContent}"</p>
                  {fb.resolutionNotes && (
                    <div className="text-[11px] text-emerald-800 font-medium">✓ HTX: {fb.resolutionNotes}</div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Status transition controls */}
        {canManageOrder && order.status !== 'Hoàn thành' && order.status !== 'Đã hủy' && (
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>🔄</span>
              <span>Cập nhật tiến trình đơn hàng</span>
            </h4>
            <div className="flex flex-col gap-2">
              {order.status === 'Mới' && (
                <button
                  onClick={() => handleUpdateStatus('Đang giao')}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-base shadow flex items-center justify-center gap-2"
                >
                  <span>🚚</span>
                  <span>Chuyển sang: ĐANG GIAO HÀNG</span>
                </button>
              )}
              {order.status === 'Đang giao' && (
                <button
                  onClick={() => handleUpdateStatus('Hoàn thành')}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base shadow flex items-center justify-center gap-2"
                >
                  <span>✅</span>
                  <span>Xác nhận: GIAO THÀNH CÔNG (HOÀN THÀNH)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action button: CN-3.9.4 Xem trước Hóa đơn điện tử */}
        {order.status !== 'Đã hủy' && (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="w-full py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-lg font-extrabold shadow-lg shadow-indigo-700/30 flex items-center justify-center gap-2"
          >
            <span>🧾</span>
            <span>XEM TRƯỚC HÓA ĐƠN ĐIỆN TỬ</span>
          </button>
        )}

        {/* Cancel order button if not completed and not already cancelled */}
        {canManageOrder && order.status !== 'Hoàn thành' && order.status !== 'Đã hủy' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 text-base font-extrabold border-2 border-red-200 flex items-center justify-center gap-2"
          >
            <span>🚫</span>
            <span>HỦY ĐƠN HÀNG NÀY</span>
          </button>
        )}

        {/* E-Invoice Preview Modal (Req 4: Bản xem trước, không hiển thị như HĐ đã phát hành) */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-sm">XEM TRƯỚC HÓA ĐƠN</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      BẢN DỰ THẢO - CHƯA PHÁT HÀNH
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Invoice Layout with Watermark */}
              <div className="relative p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-amber-300 text-xs space-y-2 font-mono overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-30deg]">
                  <span className="text-4xl font-black text-red-600 border-4 border-red-600 p-2 uppercase">
                    BẢN DỰ THẢO
                  </span>
                </div>

                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <div className="font-bold text-sm text-slate-900 uppercase">{currentHTX.name}</div>
                  <div className="text-[11px] text-slate-500">{currentHTX.address}</div>
                  <div className="text-[11px] text-slate-500">MST: 0900123456 • ĐT: {currentHTX.phone}</div>
                </div>

                <div className="pt-1 space-y-1">
                  <div><strong>Mã HĐ dự thảo:</strong> {order.invoiceNumber || 'HDDT-DRAFT-2026'}</div>
                  <div><strong>Ngày lập đơn:</strong> {order.date}</div>
                  <div><strong>Bên bán:</strong> {order.sellerName || currentHTX.name} ({order.sellerType === 'ho_dan' ? 'Hộ dân' : 'HTX'})</div>
                  <div><strong>Khách hàng:</strong> {order.customerName}</div>
                  <div><strong>SĐT khách:</strong> {order.customerPhone}</div>
                  {order.salesChannel && (
                    <div><strong>Kênh bán:</strong> {order.salesChannel}</div>
                  )}
                </div>

                <div className="py-2 border-t border-b border-dashed border-slate-300 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Mặt hàng</span>
                    <span>Thành tiền</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {order.productName} ({order.quantity} {order.unit})
                    </span>
                    <span>{order.totalAmount.toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-emerald-700">{order.totalAmount.toLocaleString()} đ</span>
                </div>

                <div className="text-center pt-2 text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  ⚠️ <em>Đây là bản xem trước phục vụ kiểm tra thông tin. Hóa đơn điện tử có mã của Cơ quan Thuế sẽ được Kế toán HTX ký số phát hành sau khi giao hàng thành công.</em>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 text-xs"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    alert('[Xem trước demo] Bản xem trước thông tin đối soát đơn hàng đã sẵn sàng gửi qua Zalo.');
                    setShowInvoiceModal(false);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow text-xs flex items-center justify-center gap-1"
                >
                  <span>📤</span>
                  <span>Gửi bản xem trước Zalo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚫</span>
                  <span className="font-extrabold text-slate-900">Xác nhận hủy đơn hàng</span>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <p className="text-sm text-slate-700">
                  Bác vui lòng nhập lý do hủy đơn hàng <strong>{order.code}</strong>:
                </p>

                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="VD: Khách hàng đổi ý, hết nguồn hàng, nhập nhầm số lượng..."
                  rows={3}
                  required
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-red-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow"
                  >
                    Xác nhận hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CẬP NHẬT GIAO HÀNG THỰC TẾ */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  <span className="font-extrabold text-slate-900">Giao hàng thực tế</span>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số lượng giao thực tế ({order.unit})
                  </label>
                  <input
                    type="number"
                    value={deliveredQty}
                    onChange={(e) => setDeliveredQty(e.target.value)}
                    max={order.quantity}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-bold focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Số lượng đặt: <strong>{order.quantity} {order.unit}</strong>. Không được giao vượt số lượng đơn.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú người nhận / biển số xe
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="VD: Giao cho anh Hùng lái xe tải..."
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const qty = parseFloat(deliveredQty) || 0;
                    const res = updateDeliveryProgress(order.id, {
                      deliveredQuantity: qty,
                      deliveryNotes: deliveryNotes.trim() || undefined,
                      deliveryStatus: qty >= order.quantity ? 'da_giao' : 'dang_giao',
                    });
                    if (res.success) {
                      setShowDeliveryModal(false);
                    } else {
                      alert(res.message);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  💾 Lưu tiến độ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL MÃ QR PHIẾU XUẤT / ĐƠN BÁN (KHÔNG ĐÓNG GÓI) */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider">
                  Mã QR Phiếu xuất / Đơn bán
                </span>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">{order.productName}</h3>
                <p className="text-xs text-slate-500 font-bold">Mã đơn: {order.code} • {order.quantity} {order.unit}</p>
                <p className="text-xs text-emerald-700 font-medium">Bên xuất: {order.sellerName || currentHTX.name}</p>
              </div>

              {/* Khung QR Code */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mx-auto shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    order.qrCodeUrl || `https://hungyen-htx.vn/trace/order/${order.code}`
                  )}`}
                  alt={`QR ${order.code}`}
                  className="w-44 h-44 mx-auto rounded-xl object-contain bg-white p-2 border border-slate-200"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mã QR truy xuất thẳng vào lô nguồn, chu kỳ và nhật ký sản xuất gốc. Không ép dựng công đoạn đóng gói giả.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => alert('Đã gửi mã tem phiếu xuất sang máy in tem mã vạch Bluetooth!')}
                  className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow active:scale-95"
                >
                  🖨️ In tem phiếu
                </button>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    navigateTo('trace_result', {
                      code: order.code,
                      order,
                    });
                  }}
                  className="py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow active:scale-95"
                >
                  🔍 Xem trang QR ➜
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
