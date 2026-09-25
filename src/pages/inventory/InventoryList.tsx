import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { InventoryItem, StockTransaction } from '../../types';

export const InventoryList: React.FC = () => {
  const { inventory, transactions, navigateTo, currentRole, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  const isFarmer = currentRole === 'R06';

  // Nếu là nông dân R06, chỉ xem các giao dịch xuất cấp cho hộ mình
  const displayTransactions = isFarmer
    ? transactions.filter(
        (t) =>
          t.type === 'export' &&
          (t.recipientOrSupplier.toLowerCase().includes(currentUser.name.toLowerCase()) ||
            t.recipientOrSupplier.includes('Tổ 1') ||
            t.recipientOrSupplier.includes('hộ'))
      )
    : transactions;

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isFarmer ? 'Vật tư được cấp phát' : 'Kho vật tư nông nghiệp'}
        voiceText={
          isFarmer
            ? `Danh sách giống, phân bón và vật tư nông nghiệp HTX cung ứng cho hộ gia đình bác.`
            : `Màn hình quản lý kho vật tư dành cho kế toán và thủ kho HTX. Bác có thể theo dõi tồn kho giống, phân bón và lập phiếu xuất nhập.`
        }
      />

      <div className="p-4 space-y-4">
        {/* Action buttons strictly restricted by RBAC (CN-3.8 / Ma trận Mục 7) */}
        {!isFarmer ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => navigateTo('inventory_tx', { type: 'import' })}
                className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
              >
                <span>📥</span>
                <span>+ Nhập kho</span>
              </button>
              <button
                onClick={() => navigateTo('inventory_tx', { type: 'export' })}
                className="flex-1 py-3.5 bg-amber-700 hover:bg-amber-800 active:scale-95 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
              >
                <span>📤</span>
                <span>- Xuất kho</span>
              </button>
            </div>
            <button
              onClick={() => navigateTo('inventory_add')}
              className="w-full py-2.5 bg-white border-2 border-slate-300 hover:border-amber-600 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>➕</span>
              <span>Thêm mặt hàng mới vào danh mục kho</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            <div>
              <strong>Chính sách cung ứng vật tư của HTX:</strong>
              <div className="text-[11px] text-blue-800 mt-0.5">
                Bà con xã viên được tạm ứng giống và phân bón chuẩn VietGAP đầu vụ, thanh toán sau thu hoạch.
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher: Tồn kho / Lịch sử nhập xuất */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200 rounded-2xl">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {isFarmer ? 'Danh mục vật tư HTX' : 'Tồn kho hiện tại'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {isFarmer ? `Đã nhận (${displayTransactions.length})` : `Lịch sử nhập/xuất (${transactions.length})`}
          </button>
        </div>

        {activeTab === 'stock' ? (
          <div className="space-y-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigateTo('inventory_detail', { item })}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-amber-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {item.category === 'Giong'
                      ? '🌾 Con giống / Giống cây'
                      : item.category === 'PhanBon'
                      ? '🌱 Phân bón'
                      : item.category === 'ThuocBVTV'
                      ? '🛡️ Thuốc vi sinh'
                      : item.category === 'ThucAn'
                      ? '🌽 Thức ăn'
                      : '📦 Bao bì tem nhãn'}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {item.name}
                  </h4>
                  {!isFarmer && item.stock <= item.minStockAlert && (
                    <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      ⚠️ Tồn kho dưới mức an toàn!
                    </span>
                  )}
                  {item.unitPrice && (
                    <div className="text-xs font-semibold text-slate-500">
                      Đơn giá: {item.unitPrice.toLocaleString()} đ/{item.unit}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold block">
                    {isFarmer ? 'Hiện có:' : 'Tồn kho:'}
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-800">
                    {item.stock.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-600 block">{item.unit}</span>
                  <span className="text-[11px] font-bold text-amber-700 mt-1 block">Chi tiết ➜</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayTransactions.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 text-center border text-slate-500 text-sm">
                Chưa có giao dịch vật tư nào được ghi nhận.
              </div>
            ) : (
              displayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigateTo('inventory_tx_detail', { transaction: tx })}
                  className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-slate-400 active:scale-[0.98] transition-all shadow-sm space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">{tx.code}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        tx.type === 'import'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-slate-900">{tx.itemName}</h4>
                    <span
                      className={`text-lg font-extrabold ${
                        tx.type === 'import' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {tx.type === 'import' ? '+' : '-'} {tx.quantity} {tx.unit}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                    <span>Đối tác/Hộ: <strong>{tx.recipientOrSupplier}</strong></span>
                    <span className="text-blue-700 font-bold">Xem phiếu ➜</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
