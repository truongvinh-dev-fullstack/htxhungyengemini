import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { ProductStockItem } from '../../types';
import { getProductStateBadge, getProductStockBadge, getStockAvailableQuantity, getStockItemAvailableQuantity } from '../../utils/harvestBalance';
import { canManagePackaging } from '../../utils/permissions';
import { ProductHandoverModal } from '../../components/ProductHandoverModal';

export const ProductStockList: React.FC = () => {
  const {
    productStocks,
    harvests,
    handovers,
    orders,
    packages,
    navigateTo,
    screenParams,
    currentRole,
    currentUser,
    currentHTX,
  } = useApp();

  const isFarmer = currentRole === 'R06';

  // Lọc theo lô thu hoạch nếu được điều hướng từ chi tiết lô
  const [filterLotId, setFilterLotId] = useState<string>(
    screenParams?.filterLotId || screenParams?.harvestLotId || ''
  );

  // State lọc cho HTX (R04, R02, R03)
  const [htxFilter, setHtxFilter] = useState<'all' | 'htx_owned' | 'consigned'>('all');

  // State tab cho Hộ nông dân (R06)
  const [farmerTab, setFarmerTab] = useState<'at_farm' | 'consigned_at_htx'>('at_farm');

  // Modal gửi hàng HTX từ dòng tồn cụ thể
  const [handoverModalStock, setHandoverModalStock] = useState<ProductStockItem | null>(null);

  // 1. Dữ liệu Kho thành phẩm HTX: CHỈ gồm sản phẩm HTX đang giữ (holderId === currentHTX.id)
  const htxHeldStocks = useMemo(() => {
    return productStocks.filter((s) => {
      if (s.htxId !== currentHTX.id) return false;
      const isHeld = s.holderId === currentHTX.id || (s.ownerType === 'htx' && !s.holderId);
      if (!isHeld) return false;

      if (htxFilter === 'htx_owned') return s.ownerType === 'htx';
      if (htxFilter === 'consigned') return s.ownerType === 'ho_dan';
      return true;
    });
  }, [productStocks, currentHTX.id, htxFilter]);

  // Thống kê Kho thành phẩm HTX
  const htxStats = useMemo(() => {
    const allHeld = productStocks.filter(
      (s) => s.htxId === currentHTX.id && (s.holderId === currentHTX.id || (s.ownerType === 'htx' && !s.holderId))
    );
    const ownedTotal = allHeld.filter((s) => s.ownerType === 'htx').reduce((sum, s) => sum + s.quantity, 0);
    const consignedTotal = allHeld.filter((s) => s.ownerType === 'ho_dan').reduce((sum, s) => sum + s.quantity, 0);
    return {
      totalCount: allHeld.length,
      ownedTotal,
      consignedTotal,
      grandTotal: ownedTotal + consignedTotal,
    };
  }, [productStocks, currentHTX.id]);

  // 2. Dữ liệu cho Hộ nông dân R06
  // A. Tồn tại hộ: do hộ giữ tại nhà/trại (holderId !== currentHTX.id và ownerId === currentUser.id)
  const farmerAtHomeStocks = useMemo(() => {
    return productStocks.filter((s) => {
      if (s.htxId !== currentHTX.id) return false;
      const isHeldByHTX = s.holderId === currentHTX.id;
      if (s.ownerId !== currentUser.id || isHeldByHTX) return false;
      if (filterLotId && s.harvestLotId !== filterLotId) return false;
      return true;
    });
  }, [productStocks, currentHTX.id, currentUser.id, filterLotId]);

  // B. Hàng ký gửi của hộ đang lưu ở kho HTX
  const farmerConsignedAtHTX = useMemo(() => {
    return productStocks.filter((s) => {
      if (s.htxId !== currentHTX.id) return false;
      const isHeldByHTX = s.holderId === currentHTX.id;
      return s.ownerId === currentUser.id && isHeldByHTX;
    });
  }, [productStocks, currentHTX.id, currentUser.id]);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isFarmer ? 'Tồn sản phẩm của tôi' : 'Kho thành phẩm HTX'}
        voiceText={
          isFarmer
            ? 'Theo dõi lượng nông sản còn tại hộ gia đình và phần hàng ký gửi HTX đang giữ bán hộ.'
            : `Kho thành phẩm ${currentHTX.name}, tách rõ hàng HTX sở hữu và hàng hộ ký gửi bán hộ.`
        }
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ================= GIAO DIỆN R04, R02, R03: KHO THÀNH PHẨM HTX ================= */}
        {!isFarmer && (
          <>
            {/* Banner tóm tắt Kho thành phẩm HTX */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">
                  KHO THÀNH PHẨM HTX {currentHTX.shortName.toUpperCase()}
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {htxStats.totalCount} dòng hàng
                </span>
              </div>

              <div className="text-3xl font-black text-amber-300">
                {htxStats.grandTotal.toLocaleString()} <span className="text-base text-white font-bold">kg / con</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs text-blue-100">
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="block text-[11px] text-blue-200">🏢 HTX sở hữu (mua đứt):</span>
                  <strong className="text-base text-white">{htxStats.ownedTotal.toLocaleString()}</strong>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="block text-[11px] text-emerald-200">🤝 Hộ ký gửi bán hộ:</span>
                  <strong className="text-base text-emerald-300">{htxStats.consignedTotal.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Quy tắc nghiệp vụ phân định ranh giới kho */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
              <span className="text-lg">ℹ️</span>
              <div className="space-y-0.5">
                <strong>Ranh giới kho thành phẩm HTX (SRS v2.1):</strong>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Kho thành phẩm chỉ quản lý hàng hóa <strong>HTX đang giữ và có thể bán</strong> (thô, sống, sơ chế, đóng gói).
                  Tồn sản phẩm còn lưu tại nhà hộ không hiển thị ở đây.
                </p>
              </div>
            </div>

            {/* Bộ lọc phân loại sở hữu */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-200 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setHtxFilter('all')}
                className={`py-2 rounded-xl transition-all ${
                  htxFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Tất cả ({htxStats.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setHtxFilter('htx_owned')}
                className={`py-2 rounded-xl transition-all ${
                  htxFilter === 'htx_owned' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                🏢 HTX sở hữu
              </button>
              <button
                type="button"
                onClick={() => setHtxFilter('consigned')}
                className={`py-2 rounded-xl transition-all ${
                  htxFilter === 'consigned' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                🤝 Hộ ký gửi
              </button>
            </div>

            {/* Danh sách dòng tồn Kho thành phẩm HTX */}
            <div className="space-y-3">
              {htxHeldStocks.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 text-slate-500 text-sm">
                  Kho HTX hiện chưa có dòng sản phẩm nào thuộc bộ lọc này.
                </div>
              ) : (
                htxHeldStocks.map((stock) => {
                  const available = getStockAvailableQuantity(stock, orders);
                  const isOwned = stock.ownerType === 'htx';
                  const stateBadge = getProductStockBadge(stock, productStocks, packages, harvests);
                  return (
                    <div
                      key={stock.id}
                      onClick={() => navigateTo('product_stock_detail', { stockId: stock.id })}
                      className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-blue-500 active:scale-[0.98] transition-all shadow-sm space-y-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">
                              Lô: {stock.harvestLotCode}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${stateBadge.color}`}>
                              {stateBadge.label}
                            </span>
                            <span
                              className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                                isOwned
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {isOwned ? '🏢 HTX sở hữu' : '🤝 Hộ ký gửi bán hộ'}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {stock.variety}
                          </h4>
                          {stock.spec && (
                            <p className="text-xs text-slate-500 font-medium">Quy cách: {stock.spec}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-blue-900">
                            {stock.quantity.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-600 ml-1">{stock.unit}</span>
                          <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                            Khả dụng bán: {available.toLocaleString()} {stock.unit}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                        <div className="flex justify-between">
                          <span>Chủ sở hữu: <strong>{stock.ownerName}</strong></span>
                          <span>Bên giữ: <strong>{stock.holderName || currentHTX.name}</strong></span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Vị trí: {stock.locationName}</span>
                          {stock.handoverId && <span>Phiếu nhận: {stock.handoverId}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ================= GIAO DIỆN R06: TỒN SẢN PHẨM CỦA HỘ ================= */}
        {isFarmer && (
          <>
            {/* Tab chuyển đổi cho Hộ dân: Tại hộ vs Ký gửi ở HTX */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFarmerTab('at_farm')}
                className={`py-2.5 rounded-xl transition-all ${
                  farmerTab === 'at_farm' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                🏡 Nông sản còn tại hộ ({farmerAtHomeStocks.length})
              </button>
              <button
                type="button"
                onClick={() => setFarmerTab('consigned_at_htx')}
                className={`py-2.5 rounded-xl transition-all ${
                  farmerTab === 'consigned_at_htx' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                🏢 Hàng ký gửi tại HTX ({farmerConsignedAtHTX.length})
              </button>
            </div>

            {/* TAB 1: NÔNG SẢN TỒN TẠI HỘ */}
            {farmerTab === 'at_farm' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                  <strong>Nông sản lưu giữ tại nhà / trang trại của bác:</strong>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Bác có thể chủ động bán trực tiếp cho thương lái, hoặc lập phiếu giao (bán đứt / ký gửi) cho HTX.
                  </p>
                </div>

                {filterLotId && (
                  <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-2xl text-xs flex items-center justify-between shadow-xs">
                    <span className="font-bold text-blue-900">
                      🔍 Đang lọc dòng tồn của lô: <strong>{harvests.find((h) => h.id === filterLotId)?.code || filterLotId}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterLotId('')}
                      className="px-2.5 py-1 bg-white border border-blue-300 rounded-xl font-bold text-blue-700 hover:bg-blue-100 text-[11px]"
                    >
                      ✕ Xem tất cả
                    </button>
                  </div>
                )}

                {farmerAtHomeStocks.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 text-slate-500 text-sm">
                    Hiện hộ bác không còn dòng nông sản nào lưu tại nhà.
                  </div>
                ) : (
                  farmerAtHomeStocks.map((stock) => {
                    const lot = harvests.find((h) => h.id === stock.harvestLotId);
                    const stateBadge = getProductStockBadge(stock, productStocks, packages, harvests);
                    const itemBalance = getStockItemAvailableQuantity(stock, orders, handovers);
                    const availableQty = itemBalance.availableQuantity;
                    const pendingQty = itemBalance.pendingHandoverQuantity;
                    const reservedOrdersQty = itemBalance.reservedOrdersQuantity;

                    return (
                      <div
                        key={stock.id}
                        className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">
                                Lô: {stock.harvestLotCode}
                              </span>
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${stateBadge.color}`}>
                                {stateBadge.label}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 leading-tight">
                              {stock.variety}
                            </h4>
                            {stock.spec && (
                              <p className="text-xs text-slate-500 font-medium">Quy cách: {stock.spec}</p>
                            )}
                            <p className="text-xs text-slate-500">Nơi lưu trữ: {stock.locationName}</p>
                          </div>

                          <div className="text-right">
                            <span className="block text-[11px] font-bold text-slate-500">Tồn vật lý:</span>
                            <span className="text-xl font-black text-emerald-800">
                              {stock.quantity.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-slate-600 ml-1">{stock.unit}</span>
                          </div>
                        </div>

                        {/* Chi tiết phân bổ tại hộ */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-800">Khả dụng để bán / giao HTX:</span>
                            <strong className="text-sm font-black text-emerald-900">
                              {availableQty.toLocaleString()} {stock.unit}
                            </strong>
                          </div>
                          {pendingQty > 0 && (
                            <div className="flex justify-between text-amber-800 text-[11px]">
                              <span>Đang giữ cho phiếu gửi HTX chờ duyệt:</span>
                              <strong className="font-bold">{pendingQty.toLocaleString()} {stock.unit}</strong>
                            </div>
                          )}
                          {reservedOrdersQty > 0 && (
                            <div className="flex justify-between text-purple-800 text-[11px]">
                              <span>Đang giữ chỗ cho đơn bán chưa giao:</span>
                              <strong className="font-bold">{reservedOrdersQty.toLocaleString()} {stock.unit}</strong>
                            </div>
                          )}
                        </div>

                        {/* Nút hành động cho hộ */}
                        <div className={`grid ${stock.state === 'da_xu_ly' && canManagePackaging(currentRole, stock.ownerId, currentUser.id) ? 'grid-cols-2' : 'grid-cols-3'} gap-2 pt-1`}>
                          <button
                            type="button"
                            onClick={() => navigateTo('product_stock_detail', { stockId: stock.id })}
                            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>🔍</span>
                            <span>Chi tiết</span>
                          </button>
                          <button
                            type="button"
                            disabled={availableQty <= 0}
                            onClick={() =>
                              navigateTo('sales_add', {
                                stockItemId: stock.id,
                                harvestLotId: stock.harvestLotId,
                                productName: stock.variety,
                                unit: stock.unit,
                                productState: stock.state,
                              })
                            }
                            className="py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                          >
                            <span>🛒</span>
                            <span>Bán trực tiếp</span>
                          </button>
                          <button
                            type="button"
                            disabled={availableQty <= 0}
                            onClick={() => setHandoverModalStock(stock)}
                            className="py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                          >
                            <span>🤝</span>
                            <span>Gửi hàng HTX</span>
                          </button>
                          {stock.state === 'da_xu_ly' && canManagePackaging(currentRole, stock.ownerId, currentUser.id) && (
                            <button
                              type="button"
                              disabled={availableQty <= 0}
                              onClick={() =>
                                navigateTo('packaging_add', {
                                  stockItemId: stock.id,
                                  harvestLotId: stock.harvestLotId,
                                })
                              }
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
                            >
                              <span>📦</span>
                              <span>Đóng gói</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: HÀNG KÝ GỬI TẠI HTX */}
            {farmerTab === 'consigned_at_htx' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
                  <strong>Nông sản hộ bác gửi HTX bán hộ:</strong>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Hàng hóa do HTX lưu giữ trong kho thành phẩm, hộ bác vẫn là chủ sở hữu hợp pháp. Khi HTX bán, hệ thống sẽ đối soát doanh thu trả về cho bác.
                  </p>
                </div>

                {farmerConsignedAtHTX.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 text-slate-500 text-sm">
                    Bác chưa có lô hàng nông sản nào ký gửi tại kho HTX.
                  </div>
                ) : (
                  farmerConsignedAtHTX.map((stock) => {
                    const stateBadge = getProductStockBadge(stock, productStocks, packages, harvests);
                    return (
                      <div
                        key={stock.id}
                        className="bg-white rounded-3xl p-4 border-2 border-blue-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">
                                Lô: {stock.harvestLotCode}
                              </span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black border ${stateBadge.color}`}>
                                {stateBadge.label}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-md">
                                HTX giữ bán hộ
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-1">
                              {stock.variety}
                            </h4>
                            {stock.spec && (
                              <p className="text-xs text-slate-500">Quy cách: {stock.spec}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-blue-900">
                              {stock.quantity.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-slate-600 ml-1">{stock.unit}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 space-y-1">
                          <div className="flex justify-between">
                            <span>Địa điểm lưu kho:</span>
                            <strong>{stock.locationName}</strong>
                          </div>
                          {stock.handoverId && (
                            <div className="flex justify-between">
                              <span>Phiếu giao nhận:</span>
                              <strong className="font-mono text-blue-900">{stock.handoverId}</strong>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Cập nhật gần nhất:</span>
                            <span>{stock.updatedAt.slice(0, 10)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* Modal gửi hàng HTX từ dòng tồn cụ thể */}
        {handoverModalStock && (
          <ProductHandoverModal
            isOpen={!!handoverModalStock}
            onClose={() => setHandoverModalStock(null)}
            harvestLot={harvests.find((h) => h.id === handoverModalStock.harvestLotId)}
            stockItem={handoverModalStock}
            onSuccess={() => setHandoverModalStock(null)}
          />
        )}
      </div>
    </div>
  );
};
