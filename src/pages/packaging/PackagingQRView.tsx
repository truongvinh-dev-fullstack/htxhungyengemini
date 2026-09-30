import React from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { canViewPackagedProduct } from '../../utils/permissions';
import { getPackageOwnership } from '../../utils/packageOwnership';

export const PackagingQRView: React.FC = () => {
  const { screenParams, currentHTX, currentRole, currentUser, packages, members, goBack, navigateTo, harvests, processingLots, productStocks } = useApp();
  const pkgId = screenParams?.pkg?.id || screenParams?.pkgId;
  const pkg = packages.find((item) =>
    item.id === pkgId && canViewPackagedProduct(
      currentRole, item, currentHTX.id, currentUser.id,
      harvests.find((lot) => lot.id === item.harvestLotId), productStocks
    )
  );

  if (!pkg) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy mã sản phẩm.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Lấy dữ liệu thực tế gắn liền với tem
  const harvestLot = harvests.find((h) => h.id === pkg.harvestLotId);
  const procLot = processingLots.find((p) => p.id === pkg.processingLotId || p.harvestLotId === pkg.harvestLotId);

  const hasProc = pkg.processingSnapshot?.hasProcessing ?? (!!pkg.processingLotId || !!procLot);
  const procSnapshot = pkg.processingSnapshot;
  const ownership = getPackageOwnership(pkg, productStocks);
  const isConsignedAtHTX = ownership.ownerType === 'ho_dan' && ownership.holderId === currentHTX.id;
  const ownerName = ownership.ownerType === 'htx'
    ? currentHTX.name
    : ownership.ownerType === 'ho_dan'
    ? `Hộ ${getCanonicalMemberName(ownership.ownerId, ownership.ownerName, members)}`
    : 'Chưa xác định';

  const handlePrint = () => {
    window.print();
  };

  const handleShareZalo = () => {
    if (navigator.share) {
      navigator.share({
        title: pkg.productName,
        text: `Mã QR truy xuất nguồn gốc: ${pkg.code}`,
        url: window.location.href,
      });
    } else {
      alert(`Đã sao chép đường dẫn mã QR ${pkg.code} để gửi qua Zalo!`);
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Tem mã QR sản phẩm"
        voiceText={`Mã QR sản phẩm ${pkg.productName}. Bác có thể chia sẻ qua Zalo hoặc kết nối máy in tem để dán lên bao bì nhé.`}
      />

      <div className="p-4 space-y-4">
        {/* Printable Stamp Preview Card */}
        <div className="bg-white rounded-3xl p-6 border-4 border-emerald-600 shadow-xl text-center space-y-4 relative">
          {/* HTX Stamp Header */}
          <div className="border-b-2 border-slate-200 pb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">{currentHTX.logo}</span>
              <h2 className="text-xl font-extrabold text-emerald-950 uppercase tracking-tight">
                {currentHTX.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{currentHTX.address}</p>
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {pkg.productName}
            </h3>
            <span className="inline-block bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full mt-1">
              {pkg.standard}
            </span>
          </div>

          <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${
            ownership.ownerType === 'ho_dan'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-sky-50 border-sky-200 text-sky-950'
          }`}>
            <div>Chủ sở hữu: <strong>{ownerName}</strong></div>
            {isConsignedAtHTX && <div>Hàng ký gửi, bên đang giữ: <strong>{currentHTX.name}</strong></div>}
            {pkg.onBehalfOfFarmer && <div>R03 đóng gói hộ</div>}
            {pkg.onBehalfOfFarmer && pkg.actorName && <div>Người thực hiện: {pkg.actorName}</div>}
          </div>

          {/* BIG QR CODE with HTX logo badge in center */}
          <div className="relative inline-block p-3 bg-white border-2 border-slate-300 rounded-3xl shadow-inner">
            <img
              src={pkg.qrCodeUrl}
              alt={pkg.code}
              className="w-56 h-56 mx-auto object-contain"
            />
            {/* Center HTX Emblem */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white border-2 border-emerald-600 flex items-center justify-center text-2xl shadow-md">
              {currentHTX.logo}
            </div>
          </div>

          <div className="space-y-1 text-sm text-slate-700 font-medium">
            <div className="font-mono font-extrabold text-base text-slate-900 tracking-wider">
              {pkg.code}
            </div>
            <div>
              Số lượng đợt này: <strong>{pkg.packQuantity} {pkg.unit}</strong>
              {pkg.netWeightPerPack && (
                <span> ({pkg.netWeightPerPack} {pkg.netWeightUnit || 'kg'}/{pkg.unit})</span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Đóng gói: {pkg.createdDate} • Hạn dùng: {pkg.expiryDate}
            </div>
          </div>

          {/* CHUỖI TRUY XUẤT NGUỒN GỐC THỰC TẾ (Req 9) */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-left text-xs space-y-2">
            <div className="font-extrabold text-emerald-950 flex items-center gap-1.5 border-b border-emerald-200 pb-1.5">
              <span>🔗</span> Chuỗi liên kết nguồn gốc nông sản:
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex items-start justify-between">
                <span className="text-slate-500">1. Vùng canh tác:</span>
                <span className="font-bold text-slate-900 text-right">
                  {harvestLot?.farmZoneName || pkg.harvestSnapshot?.farmZoneName || 'Thửa Đầm Bông'}
                  {harvestLot?.zoneCode ? ` (${harvestLot.zoneCode})` : ''}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-500">2. Mùa vụ:</span>
                <span className="font-bold text-emerald-800 text-right">
                  {harvestLot?.seasonName || 'Vụ Canh tác HTX'}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-500">3. Lô thu hoạch:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {pkg.harvestLotCode || harvestLot?.code || 'TH-HTX-2026'}
                  {harvestLot?.date ? ` (${harvestLot.date})` : ''}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-500">4. Nguồn gốc đóng gói:</span>
                <span className="font-bold text-slate-900 text-right">
                  {pkg.sourceProductState === 'hang_tho'
                    ? '🌾 Từ hàng thô · Chưa sơ chế'
                    : pkg.sourceProductState === 'da_xu_ly'
                    ? '⚙️ Từ hàng đã sơ chế'
                    : (pkg.isLiveProduct || (!hasProc && !pkg.processingLotId))
                    ? '🌾 Từ hàng thô'
                    : '⚠️ Nguồn đóng gói chưa xác định'}
                </span>
              </div>

              {pkg.sourceStockItemId && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">5. Dòng tồn nguồn:</span>
                  <span className="font-mono font-bold text-blue-900 text-right">
                    {pkg.sourceStockItemId}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <span className="text-slate-500">{pkg.sourceStockItemId ? '6' : '5'}. Sơ chế:</span>
                <span className="font-semibold text-right">
                  {hasProc ? (
                    <span className="text-blue-800 font-bold">
                      {procSnapshot?.method || procLot?.method || 'Xay xát phân loại'} (Ra: {procSnapshot?.outputQuantity || procLot?.outputQuantity || 816} {procSnapshot?.unit || 'kg'})
                    </span>
                  ) : (
                    <span className="text-slate-600 italic">Đóng gói trực tiếp không sơ chế</span>
                  )}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-500">{pkg.sourceStockItemId ? '7' : '6'}. Tiêu chuẩn dán nhãn:</span>
                <span className="font-bold text-emerald-700 text-right">
                  {pkg.standard}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold">
            🔍 Quét mã bằng Zalo hoặc Camera để xem toàn bộ hành trình canh tác
          </div>
        </div>

        {/* 2 Big Action Buttons: Share Zalo & Print */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigateTo('trace_result', { code: pkg.code })}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-base font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <span>👁️</span>
            <span>XEM TRANG TRUY XUẤT CÔNG KHAI</span>
          </button>

          <button
            onClick={handleShareZalo}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-base font-bold shadow flex items-center justify-center gap-2"
          >
            <span className="text-xl">💬</span>
            <span>CHIA SẺ QUA ZALO</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-base font-bold shadow flex items-center justify-center gap-2"
          >
            <span className="text-xl">🖨️</span>
            <span>IN TEM MÃ QR</span>
          </button>

          <button
            onClick={() => navigateTo('packaging_list')}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-bold"
          >
            Quay lại danh sách đóng gói
          </button>
        </div>
      </div>
    </div>
  );
};
