import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { InventoryItem, StockTransaction } from '../../types';

export const InventoryList: React.FC = () => {
  const { inventory, transactions, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Kho vật tư nông nghiệp"
        voiceText="Màn hình quản lý kho vật tư dành cho kế toán và thủ kho HTX. Bác có thể theo dõi tồn kho giống, phân bón và lập phiếu xuất nhập."
      />

      <div className="p-4 space-y-4">
        {/* Switcher & Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigateTo('inventory_tx', { type: 'import' })}
            className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
          >
            <span>📥</span>
            <span>+ Nhập kho</span>
          </button>
          <button
            onClick={() => navigateTo('inventory_tx', { type: 'export' })}
            className="flex-1 py-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
          >
            <span>📤</span>
            <span>- Xuất kho</span>
          </button>
        </div>

        {/* Tab switcher: Tồn kho / Lịch sử nhập xuất */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200 rounded-2xl">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Tồn kho hiện tại
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Lịch sử nhập/xuất ({transactions.length})
          </button>
        </div>

        {activeTab === 'stock' ? (
          <div className="space-y-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {item.category === 'Giong'
                      ? '🌾 Con giống / Giống cây'
                      : item.category === 'PhanBon'
                      ? '🌱 Phân bón'
                      : item.category === 'ThuocBVTV'
                      ? '🛡️ Thuốc vi sinh'
                      : '📦 Bao bì tem nhãn'}
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {item.name}
                  </h4>
                  {item.stock <= item.minStockAlert && (
                    <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      ⚠️ Tồn kho dưới mức an toàn!
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold block">Tồn kho:</span>
                  <span className="text-2xl font-extrabold text-emerald-800">
                    {item.stock.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-600 block">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-2"
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
                  <span>{tx.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
