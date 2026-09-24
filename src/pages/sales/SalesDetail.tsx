import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SalesOrder } from '../../types';

export const SalesDetail: React.FC = () => {
  const { screenParams, currentHTX, goBack } = useApp();
  const order: SalesOrder = screenParams?.order;
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy đơn hàng.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết đơn hàng"
        voiceText={`Đơn hàng mã ${order.code} của khách hàng ${order.customerName}, tổng giá trị ${order.totalAmount.toLocaleString()} đồng.`}
      />

      <div className="p-4 space-y-4">
        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block">{order.code}</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{order.customerName}</h3>
              <p className="text-xs text-slate-500 font-semibold">{order.customerPhone}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                order.status === 'Hoàn thành'
                  ? 'bg-emerald-100 text-emerald-800'
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
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
            <span className="text-sm font-bold text-purple-900">Tổng thanh toán:</span>
            <span className="text-2xl font-extrabold text-purple-950">
              {order.totalAmount.toLocaleString()} đ
            </span>
          </div>
        </div>

        {/* Action button: CN-3.9.4 Xem trước Hóa đơn điện tử */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="w-full py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-lg font-extrabold shadow-lg shadow-indigo-700/30 flex items-center justify-center gap-2"
        >
          <span>🧾</span>
          <span>XEM TRƯỚC HÓA ĐƠN ĐIỆN TỬ</span>
        </button>

        {/* E-Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧾</span>
                  <span className="font-extrabold text-slate-900">HÓA ĐƠN ĐIỆN TỬ</span>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Invoice Layout */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <div className="font-bold text-sm text-slate-900 uppercase">{currentHTX.name}</div>
                  <div className="text-[11px] text-slate-500">{currentHTX.address}</div>
                  <div className="text-[11px] text-slate-500">MST: 0900123456 • ĐT: {currentHTX.phone}</div>
                </div>

                <div className="pt-1 space-y-1">
                  <div><strong>Mã HĐ:</strong> {order.invoiceNumber || 'HDDT-HY-00984'}</div>
                  <div><strong>Ngày lập:</strong> {order.date}</div>
                  <div><strong>Khách hàng:</strong> {order.customerName}</div>
                  <div><strong>SĐT khách:</strong> {order.customerPhone}</div>
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

                <div className="text-center pt-2 text-[10px] text-slate-400">
                  Hóa đơn điện tử có chữ ký số hợp lệ của Ban Quản trị HTX.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    alert('Đã gửi hóa đơn điện tử qua Zalo cho khách hàng!');
                    setShowInvoiceModal(false);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow"
                >
                  Gửi qua Zalo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
