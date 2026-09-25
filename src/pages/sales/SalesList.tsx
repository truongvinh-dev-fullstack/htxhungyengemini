import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SalesOrder } from '../../types';

export const SalesList: React.FC = () => {
  const { orders, navigateTo, currentRole, currentUser } = useApp();

  // Phân quyền dữ liệu đơn hàng (SRS Mục 7: R06 chỉ xem đơn của hộ mình; R04/R02 xem toàn bộ đơn HTX)
  const scopedOrders = orders.filter((o) => {
    if (currentRole === 'R06') {
      return o.sellerId === currentUser.id || o.sellerName === currentUser.name;
    }
    return true;
  });

  // Doanh thu thực tế chỉ ghi nhận các đơn đã "Hoàn thành"
  const completedOrders = scopedOrders.filter((o) => o.status === 'Hoàn thành');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = scopedOrders.filter((o) => o.status === 'Mới' || o.status === 'Đang giao');

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentRole === 'R06' ? 'Đơn hàng của hộ tôi' : 'Quản lý Bán hàng & Đơn'}
        voiceText={`Danh sách đơn bán nông sản ${currentRole === 'R06' ? 'của hộ gia đình bác' : 'của Hợp tác xã'}. Tổng doanh thu thực thu: ${totalRevenue.toLocaleString()} đồng.`}
      />

      <div className="p-4 space-y-4">
        {/* CN-3.9.5: Mobile Mini Revenue Summary */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
              DOANH THU ĐÃ THỰC THU (HOÀN THÀNH)
            </span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">Tháng 09/2026</span>
          </div>

          <div className="text-3xl font-extrabold text-amber-300">
            {totalRevenue.toLocaleString()} đ
          </div>

          <div className="flex items-center justify-between text-xs text-purple-100 pt-1 border-t border-white/20">
            <span>Tổng số: <strong>{scopedOrders.length} đơn</strong> ({pendingOrders.length} đang xử lý)</span>
            <span>Đã giao xong: <strong>{completedOrders.length} đơn</strong></span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Danh sách đơn hàng</h3>
          <button
            onClick={() => navigateTo('sales_add')}
            className="bg-purple-700 hover:bg-purple-800 active:scale-95 text-white px-4 py-2.5 rounded-2xl font-extrabold text-sm flex items-center gap-1.5 shadow"
          >
            <span>➕</span>
            <span>Tạo đơn mới</span>
          </button>
        </div>

        {/* List of Orders */}
        <div className="space-y-3">
          {scopedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigateTo('sales_detail', { order })}
              className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-purple-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 font-bold block">
                    {order.code}
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {order.customerName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{order.customerPhone}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'Hoàn thành'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'Đang giao'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'Đã hủy'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-sm">
                <div className="font-bold text-slate-800">{order.productName}</div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Số lượng: <strong>{order.quantity} {order.unit}</strong></span>
                  <span className="font-extrabold text-base text-purple-900">
                    {order.totalAmount.toLocaleString()} đ
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Ngày đặt: {order.date}</span>
                <span className="font-bold text-purple-700">Xem hóa đơn điện tử ➜</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
