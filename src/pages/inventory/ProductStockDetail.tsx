import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { canManagePackaging, canViewProductStock } from '../../utils/permissions';
import { getProductStateBadge, getProductStockBadge, getStockItemAvailableQuantity } from '../../utils/harvestBalance';
import { ProductHandoverModal } from '../../components/ProductHandoverModal';

export const ProductStockDetail: React.FC = () => {
  const {
    screenParams,
    productStocks,
    harvests,
    handovers,
    orders,
    packages,
    currentHTX,
    currentRole,
    currentUser,
    goBack,
    navigateTo,
  } = useApp();

  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const stockId = screenParams?.stockId || screenParams?.stock?.id;
  const stock = productStocks.find((s) => s.id === stockId && s.htxId === currentHTX.id);

  if (!stock || !canViewProductStock(currentRole, stock, currentHTX.id, currentUser.id)) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
          🚫
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Không có quyền truy cập dòng tồn</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Dòng tồn sản phẩm này không thuộc quyền quản lý của bạn hoặc không nằm trong phạm vi cho phép.
          </p>
        </div>
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isHeldByHTX = stock.holderId === currentHTX.id || (stock.ownerType === 'htx' && !stock.holderId);
  const isOwnedByHTX = stock.ownerType === 'htx';
  const itemBalance = getStockItemAvailableQuantity(stock, orders, handovers);
  const availableQty = itemBalance.availableQuantity;
  const stateBadge = getProductStockBadge(stock, productStocks, packages, harvests);
  const sourceLot = harvests.find(
    (h) => h.id === stock.harvestLotId || (stock.harvestLotCode && h.code === stock.harvestLotCode)
  );
  const isFarmer = currentRole === 'R06';

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết tồn sản phẩm"
        voiceText={`Dòng tồn sản phẩm ${stock.variety}, số lượng ${stock.quantity} ${stock.unit}.`}
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Main Info Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-slate-400 block">
                MÃ TỒN: {stock.id}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${stateBadge.color}`}>
                  {stateBadge.label}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    isOwnedByHTX
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      : isHeldByHTX
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {isOwnedByHTX
                    ? '🏢 HTX sở hữu'
                    : isHeldByHTX
                    ? '🤝 Hộ ký gửi bán hộ'
                    : '🏡 Hộ giữ tại trang trại'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stock.variety}</h3>
              <p className="text-xs text-slate-500 font-semibold">Lô nguồn: {stock.harvestLotCode}</p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-500">
                {stock.state === 'hang_tho' ? 'Tồn hàng thô còn lại:' : 'Tồn vật lý dòng hàng:'}
              </span>
              <strong className="text-2xl font-black text-slate-900">
                {stock.quantity.toLocaleString()} <span className="text-sm font-bold text-slate-600">{stock.unit}</span>
              </strong>
            </div>
            <div>
              <span className="block text-xs font-bold text-emerald-700">Khả dụng để bán / giao HTX:</span>
              <strong className="text-2xl font-black text-emerald-800">
                {availableQty.toLocaleString()} <span className="text-sm font-bold text-slate-600">{stock.unit}</span>
              </strong>
            </div>
          </div>

          {/* Phân bổ giữ chỗ nếu có */}
          {(itemBalance.pendingHandoverQuantity > 0 || itemBalance.reservedOrdersQuantity > 0) && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
              {itemBalance.pendingHandoverQuantity > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>Đang giữ cho phiếu gửi HTX chờ duyệt:</span>
                  <strong className="font-bold">{itemBalance.pendingHandoverQuantity.toLocaleString()} {stock.unit}</strong>
                </div>
              )}
              {itemBalance.reservedOrdersQuantity > 0 && (
                <div className="flex justify-between text-purple-800">
                  <span>Đang giữ chỗ cho đơn bán chưa giao:</span>
                  <strong className="font-bold">{itemBalance.reservedOrdersQuantity.toLocaleString()} {stock.unit}</strong>
                </div>
              )}
            </div>
          )}

          {/* Specification & Legal Boundary */}
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Trạng thái sản phẩm:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${stateBadge.color}`}>
                {stateBadge.label}
              </span>
            </div>
            {stock.state === 'da_dong_goi' && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nguồn gốc đóng gói:</span>
                <span className="font-bold text-slate-900">
                  {stateBadge.sourceOrigin === 'hang_tho'
                    ? '🌾 Từ hàng thô · Chưa sơ chế'
                    : stateBadge.sourceOrigin === 'da_xu_ly'
                    ? '⚙️ Từ hàng đã sơ chế'
                    : '⚠️ Nguồn đóng gói chưa xác định'}
                </span>
              </div>
            )}
            {stock.sourceStockItemId && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mã dòng tồn nguồn:</span>
                <span className="font-mono font-bold text-blue-900">{stock.sourceStockItemId}</span>
              </div>
            )}
            {stock.totalNetWeight && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tổng khối lượng tịnh:</span>
                <span className="font-bold text-emerald-800">
                  {stock.totalNetWeight.toLocaleString()} kg ({stock.quantity} {stock.unit} x {stock.netWeightPerPack} kg)
                </span>
              </div>
            )}
            {stock.spec && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Quy cách hàng:</span>
                <span className="font-bold">{stock.spec}</span>
              </div>
            )}
            {sourceLot && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sản lượng thu hoạch ban đầu của lô nguồn:</span>
                <span className="font-bold text-slate-900">
                  {sourceLot.yieldQuantity.toLocaleString()} {sourceLot.unit}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Chủ sở hữu pháp lý:</span>
              <span className="font-bold text-slate-900">{stock.ownerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Bên đang giữ hàng:</span>
              <span className="font-bold text-slate-900">{stock.holderName || (isHeldByHTX ? currentHTX.name : stock.ownerName)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Vị trí lưu kho:</span>
              <span className="font-bold">{stock.locationName}</span>
            </div>
            {stock.handoverId && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phiếu giao nhận nguồn:</span>
                <span className="font-mono font-bold text-blue-900">{stock.handoverId}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Cập nhật lúc:</span>
              <span className="font-semibold text-slate-600">{stock.updatedAt.slice(0, 16).replace('T', ' ')}</span>
            </div>
          </div>

          {stock.notes && (
            <div className="p-3 bg-amber-50 rounded-2xl text-xs text-amber-900 border border-amber-200">
              <strong>Ghi chú:</strong> {stock.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {sourceLot && (
            <button
              type="button"
              onClick={() =>
                navigateTo('harvest_detail', {
                  lot: sourceLot,
                  harvestLotId: stock.harvestLotId,
                  harvestLotCode: stock.harvestLotCode,
                })
              }
              className="w-full py-3.5 bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-900 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
            >
              <span>🌾</span>
              <span>Xem chi tiết lô thu hoạch nguồn ({stock.harvestLotCode})</span>
            </button>
          )}

          {/* Button bán hàng cho HTX (R04) hoặc Hộ (R06) */}
          {availableQty > 0 && (
            <button
              type="button"
              onClick={() =>
                navigateTo('sales_add', {
                  stockItemId: stock.id,
                  harvestLotId: stock.harvestLotId,
                  productName: stock.variety,
                  unit: stock.unit,
                  productState: stock.state,
                })
              }
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <span>🛒</span>
              <span>Tạo đơn bán từ dòng tồn này</span>
            </button>
          )}

          {/* Button gửi hàng HTX cho hộ nông dân */}
          {isFarmer && !isHeldByHTX && availableQty > 0 && (
            <button
              type="button"
              onClick={() => setIsHandoverOpen(true)}
              className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <span>🤝</span>
              <span>Gửi hàng HTX từ dòng tồn này</span>
            </button>
          )}

          {/* Button đóng gói cho hàng đã sơ chế */}
          {stock.state === 'da_xu_ly' && canManagePackaging(currentRole, stock.ownerId, currentUser.id) && availableQty > 0 && (
            <button
              type="button"
              onClick={() =>
                navigateTo('packaging_add', {
                  stockItemId: stock.id,
                  harvestLotId: stock.harvestLotId,
                })
              }
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <span>📦</span>
              <span>Đóng gói từ dòng tồn này ({availableQty.toLocaleString()} {stock.unit} khả dụng)</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal gửi hàng HTX */}
      {isHandoverOpen && (
        <ProductHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          lot={sourceLot}
          stockItem={stock}
          onSuccess={() => setIsHandoverOpen(false)}
        />
      )}
    </div>
  );
};
