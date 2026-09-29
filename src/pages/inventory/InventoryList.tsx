import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const InventoryList: React.FC = () => {
  const {
    inventory,
    transactions,
    navigateTo,
    currentRole,
    currentUser,
    currentHTX,
  } = useApp();

  const isFarmer = currentRole === 'R06';
  const isAccountant = currentRole === 'R04';

  // Tabs cho HTX (R04, R02, R03)
  const [activeTab, setActiveTab] = useState<'supplies_stock' | 'history'>('supplies_stock');

  // Lọc vật tư theo HTX
  const htxInventory = useMemo(() => {
    return inventory.filter((item) => item.htxId === currentHTX.id);
  }, [inventory, currentHTX.id]);

  // Lọc lịch sử theo HTX
  const htxTransactions = useMemo(() => {
    return transactions.filter((t) => t.htxId === currentHTX.id);
  }, [transactions, currentHTX.id]);

  // Đối với Hộ nông dân R06:
  // CHỈ xem các phiếu cấp phát vật tư cho chính hộ mình.
  // Không xem danh mục tồn kho HTX hoặc phiếu của hộ khác.
  const farmerSuppliesReceived = useMemo(() => {
    const cleanUserName = currentUser.name.replace(/^bác\s+/i, '').trim().toLowerCase();
    return htxTransactions.filter((t) => {
      if (t.type !== 'export') return false;
      const target = (t.recipientOrSupplier || '').toLowerCase();
      return (
        target.includes(cleanUserName) ||
        target.includes(currentUser.id.toLowerCase()) ||
        (currentUser.phone && target.includes(currentUser.phone.replace(/[\s.-]/g, '')))
      );
    });
  }, [htxTransactions, currentUser]);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isFarmer ? 'Vật tư đã cấp cho tôi' : 'Kho vật tư HTX'}
        voiceText={
          isFarmer
            ? 'Danh sách giống, phân bón và vật tư nông nghiệp HTX đã cấp phát cho hộ bác.'
            : `Quản lý kho vật tư đầu vào sản xuất của ${currentHTX.name}.`
        }
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ================= GIAO DIỆN HỘ R06: VẬT TƯ ĐÃ CẤP CHO HỘ ================= */}
        {isFarmer ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-3xl space-y-1.5 text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-1.5 text-sm font-black text-emerald-900">
                <span>🌱</span>
                <span>Vật tư HTX cấp phát theo kế hoạch vụ/lứa</span>
              </div>
              <p className="text-[12px] text-emerald-800 leading-relaxed">
                Đây là các đợt giống, phân bón, thuốc sinh học HTX đã xuất cấp cho hộ bác.
                Lượng vật tư thực tế đã sử dụng được lưu vết trong từng lần ghi <strong>Nhật ký sản xuất</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-extrabold text-slate-800">Lịch sử nhận vật tư</h3>
                <span className="text-xs font-bold text-slate-500">
                  {farmerSuppliesReceived.length} đợt nhận
                </span>
              </div>

              {farmerSuppliesReceived.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 text-slate-500 text-sm">
                  Chưa có phiếu cấp phát vật tư nào cho hộ bác trong vụ này.
                </div>
              ) : (
                farmerSuppliesReceived.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-md">
                          Mã phiếu: {tx.code}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                          {tx.itemName}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-800">
                          {tx.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-600 ml-1">{tx.unit}</span>
                        <div className="text-[11px] text-slate-400 font-semibold">{tx.date}</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                      <div>
                        <span>Người nhận: </span>
                        <strong>{tx.recipientOrSupplier}</strong>
                      </div>
                      {tx.notes && (
                        <div className="text-slate-500 italic">
                          Mục đích: {tx.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ================= GIAO DIỆN R04, R02, R03: KHO VẬT TƯ HTX ================= */
          <div className="space-y-4">
            {/* Banner tóm tắt */}
            <div className="bg-gradient-to-r from-amber-700 to-yellow-800 text-white rounded-3xl p-5 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-200">
                  KHO VẬT TƯ & ĐẦU VÀO HTX
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {htxInventory.length} mặt hàng
                </span>
              </div>
              <h3 className="text-2xl font-black">{currentHTX.name}</h3>
              <p className="text-xs text-amber-100 leading-relaxed">
                Quản lý giống, phân bón, thuốc BVTV sinh học, thức ăn chăn nuôi & bao bì đóng gói.
              </p>
            </div>

            {/* Các nút hành động nghiệp vụ (chỉ R04 được lập phiếu nhập/xuất) */}
            {isAccountant && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('inventory_tx', { type: 'import' })}
                    className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>📥</span>
                    <span>+ Nhập kho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('inventory_tx', { type: 'export' })}
                    className="flex-1 py-3.5 bg-amber-700 hover:bg-amber-800 active:scale-95 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>📤</span>
                    <span>- Cấp phát hộ</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('inventory_add')}
                  className="w-full py-2.5 bg-white border-2 border-slate-300 hover:border-amber-600 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>➕</span>
                  <span>Thêm mặt hàng vật tư mới vào danh mục kho</span>
                </button>
              </div>
            )}

            {/* Tab switcher giữa Tồn kho vật tư và Lịch sử phiếu */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('supplies_stock')}
                className={`py-2.5 rounded-xl transition-all ${
                  activeTab === 'supplies_stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                🏬 Tồn kho vật tư ({htxInventory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2.5 rounded-xl transition-all ${
                  activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                📋 Lịch sử nhập / xuất ({htxTransactions.length})
              </button>
            </div>

            {/* TAB 1: TỒN KHO VẬT TƯ */}
            {activeTab === 'supplies_stock' && (
              <div className="space-y-3">
                {htxInventory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigateTo('inventory_detail', { item })}
                    className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-amber-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {item.category === 'Giong'
                          ? '🌾 Con giống / Cây giống'
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
                      {item.stock <= item.minStockAlert && (
                        <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
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
                      <span className={`text-2xl font-black ${item.stock <= item.minStockAlert ? 'text-red-600' : 'text-amber-800'}`}>
                        {item.stock.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1">{item.unit}</span>
                      <span className="block text-[11px] text-slate-400 mt-1">Chi tiết ➜</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: LỊCH SỬ PHIẾU NHẬP / XUẤT */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {htxTransactions.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 text-slate-500 text-sm">
                    Chưa có giao dịch nhập/xuất kho nào được ghi nhận.
                  </div>
                ) : (
                  htxTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => navigateTo('inventory_tx_detail', { tx })}
                      className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-amber-500 active:scale-[0.98] transition-all shadow-sm space-y-2 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              {tx.code}
                            </span>
                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                                tx.type === 'import'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {tx.type === 'import' ? '📥 Nhập kho' : '📤 Xuất cấp'}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900 mt-1">
                            {tx.itemName}
                          </h4>
                        </div>

                        <div className="text-right">
                          <span className={`text-xl font-black ${tx.type === 'import' ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {tx.type === 'import' ? '+' : '-'}{tx.quantity.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-600 ml-1">{tx.unit}</span>
                          <div className="text-[11px] text-slate-400 font-semibold">{tx.date}</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span>Đối tác / Hộ nhận: <strong>{tx.recipientOrSupplier}</strong></span>
                        <span className="text-slate-400 font-bold">Chi tiết ➜</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
