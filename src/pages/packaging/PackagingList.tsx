import React from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { PostHarvestWorkflowTabs } from '../../components/PostHarvestWorkflowTabs';
import { canManagePackaging, canViewPackagedProduct } from '../../utils/permissions';
import { getPackageOwnership } from '../../utils/packageOwnership';

export const PackagingList: React.FC = () => {
  const { packages, harvests, productStocks, members, currentHTX, currentRole, currentUser, navigateTo } = useApp();
  const canCreate = canManagePackaging(currentRole);
  const visiblePackages = packages.filter((pkg) =>
    canViewPackagedProduct(
      currentRole, pkg, currentHTX.id, currentUser.id,
      harvests.find((lot) => lot.id === pkg.harvestLotId), productStocks
    )
  );

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentRole === 'R04' ? 'Lô đóng gói & QR' : 'Đóng gói sản phẩm & Mã QR'}
        voiceText={canCreate
          ? 'Đây là danh sách lô đã đóng gói và mã QR. Bác có thể bấm Tạo mã mới để đóng gói lô thu hoạch.'
          : 'Đây là danh sách lô đóng gói HTX sở hữu hoặc đang giữ, gồm cả hàng ký gửi.'}
      />

      <div className="p-4 space-y-4">
        {/* Chuỗi 2 công đoạn */}
        <PostHarvestWorkflowTabs activeTab="packaging" />

        {/* Action Banner */}
        {canCreate && <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-emerald-950">Đóng gói đợt mới</h3>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">
              Chọn lô thu hoạch → Định lượng thành phẩm → Cấp tem QR
            </p>
          </div>
          <button
            onClick={() => navigateTo('packaging_add')}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-1.5 shadow-md shadow-emerald-600/30 whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            <span>Tạo mã mới</span>
          </button>
        </div>}

        {/* List of Packaged items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Sản phẩm đã tạo mã QR</h3>
            <span className="text-xs text-slate-500 font-semibold">{visiblePackages.length} lô</span>
          </div>

          {visiblePackages.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
              <span className="text-5xl">📦</span>
              <h4 className="text-xl font-bold text-slate-800">Chưa có mã đóng gói nào</h4>
              <p className="text-sm text-slate-500">
                {canCreate
                  ? 'Bác hãy bấm nút "Tạo mã mới" để đóng gói lô thu hoạch nhé.'
                  : 'Chưa có lô đóng gói nào trong phạm vi được xem.'}
              </p>
            </div>
          ) : (
            visiblePackages.map((pkg) => {
              const hasProc = pkg.processingSnapshot?.hasProcessing || !!pkg.processingLotId;
              const ownership = getPackageOwnership(pkg, productStocks);
              const isConsignedAtHTX = ownership.ownerType === 'ho_dan' && ownership.holderId === currentHTX.id;
              const ownerName = ownership.ownerType === 'htx'
                ? currentHTX.name
                : ownership.ownerType === 'ho_dan'
                ? getCanonicalMemberName(ownership.ownerId, ownership.ownerName, members)
                : 'Chưa xác định';
              return (
                <div
                  key={pkg.id}
                  onClick={() => navigateTo('packaging_qr', { pkg })}
                  className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-emerald-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Small QR Thumbnail */}
                    <img
                      src={pkg.qrCodeUrl}
                      alt={pkg.code}
                      className="w-20 h-20 rounded-2xl border-2 border-slate-200 p-1 bg-white flex-shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="inline-block bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                          {pkg.code}
                        </span>
                        {pkg.harvestLotCode && (
                          <span className="inline-block bg-orange-100 text-orange-900 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                            🌾 {pkg.harvestLotCode}
                          </span>
                        )}
                        {hasProc ? (
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ✓ Có sơ chế
                          </span>
                        ) : (
                          <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Không sơ chế
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                        {pkg.productName}
                      </h4>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 font-semibold flex-wrap">
                        <span>Số lượng: <strong>{pkg.packQuantity} {pkg.unit}</strong></span>
                        {pkg.netWeightPerPack && (
                          <span>({pkg.netWeightPerPack} {pkg.netWeightUnit || 'kg'}/{pkg.unit})</span>
                        )}
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{pkg.standard}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border px-3 py-2.5 text-xs space-y-1 ${
                    ownership.ownerType === 'ho_dan'
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : ownership.ownerType === 'htx'
                      ? 'border-sky-200 bg-sky-50 text-sky-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black uppercase tracking-wide">
                        {isConsignedAtHTX ? '📦 Hàng ký gửi tại HTX' : ownership.ownerType === 'ho_dan' ? '👤 Lô của hộ' : ownership.ownerType === 'htx' ? '🏢 Lô của HTX' : 'Chưa rõ chủ sở hữu'}
                      </span>
                      {pkg.onBehalfOfFarmer && <span className="font-bold">🤝 R03 đóng gói hộ</span>}
                      <span>Chủ sở hữu: <strong>{ownership.ownerType === 'ho_dan' ? `Hộ ${ownerName}` : ownerName}</strong></span>
                    </div>
                    {isConsignedAtHTX && <div>Bên đang giữ: <strong>{currentHTX.name}</strong></div>}
                    {pkg.onBehalfOfFarmer && pkg.actorName && (
                      <div>Người đóng gói hộ: <strong>{pkg.actorName}</strong></div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>Đóng gói: <strong>{pkg.createdDate}</strong> • Hạn: <strong>{pkg.expiryDate}</strong></span>
                    <span className="font-bold text-emerald-700">Xem tem QR ➜</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
