import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { InventoryItem } from '../../types';

export const InventoryDetail: React.FC = () => {
  const { screenParams, goBack, transactions, navigateTo, currentRole } = useApp();
  const item: InventoryItem = screenParams?.item;

  if (!item) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy thông tin mặt hàng vật tư.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Lọc lịch sử giao dịch liên quan đến mặt hàng này
  const itemTransactions = transactions.filter((t) => t.itemName === item.name);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thẻ kho vật tư"
        voiceText={`Thẻ kho mặt hàng ${item.name}. Số lượng tồn hiện tại là ${item.stock} ${item.unit}.`}
      />

      <div className="p-4 space-y-4">
        {/* Item Overview Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {item.category === 'Giong'
                  ? '🌾 Con giống / Cây giống'
                  : item.category === 'PhanBon'
                  ? '🌱 Phân bón'
                  : item.category === 'ThuocBVTV'
                  ? '🛡️ Thuốc vi sinh'
                  : item.category === 'ThucAn'
                  ? '🌽 Thức ăn chăn nuôi'
                  : '📦 Bao bì tem nhãn'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">{item.name}</h2>
            </div>
            <span className="bg-slate-100 font-mono text-xs font-bold px-2 py-1 rounded-xl text-slate-600">
              {item.id}
            </span>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Số lượng tồn kho:</span>
              <span className="text-3xl font-black text-amber-950">
                {item.stock.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-800 ml-1.5">{item.unit}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Định mức cảnh báo:</span>
              <span className="text-sm font-extrabold text-slate-800">
                &lt; {item.minStockAlert} {item.unit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Đơn giá dự toán:</span>
              <span className="text-base font-extrabold text-slate-900">
                {(item.unitPrice || 0).toLocaleString()} đ/{item.unit}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-medium block">Tổng giá trị tồn:</span>
              <span className="text-base font-extrabold text-purple-900">
                {((item.stock || 0) * (item.unitPrice || 0)).toLocaleString()} đ
              </span>
            </div>
          </div>

          {item.description && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold block mb-1">Mô tả đặc tính kỹ thuật:</span>
              <p className="text-slate-700 font-medium leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Quick Transaction Actions (chỉ hiển thị cho R04 / Kế toán / Ban quản trị) */}
          {currentRole !== 'R06' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <button
                onClick={() => navigateTo('inventory_tx', { type: 'import', itemName: item.name })}
                className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1 shadow"
              >
                <span>📥</span>
                <span>Nhập kho thêm</span>
              </button>
              <button
                onClick={() => navigateTo('inventory_tx', { type: 'export', itemName: item.name })}
                className="py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1 shadow"
              >
                <span>📤</span>
                <span>Xuất cấp phát</span>
              </button>
            </div>
          )}
        </div>

        {/* Transaction History for this Item */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Lịch sử nhập / xuất mặt hàng này ({itemTransactions.length})
            </h3>
          </div>

          {itemTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Chưa phát sinh chứng từ nhập/xuất cho mặt hàng này.
            </p>
          ) : (
            <div className="space-y-2">
              {itemTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigateTo('inventory_tx_detail', { transaction: tx })}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.type === 'import'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-bold">{tx.code}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {tx.recipientOrSupplier} • {tx.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        tx.type === 'import' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {tx.type === 'import' ? '+' : '-'} {tx.quantity} {tx.unit}
                    </span>
                    <span className="block text-[11px] text-slate-400">Xem ➜</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
