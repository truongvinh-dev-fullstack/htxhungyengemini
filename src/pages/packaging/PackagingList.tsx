import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { PackagedProduct } from '../../types';
import { PostHarvestWorkflowTabs } from '../../components/PostHarvestWorkflowTabs';

export const PackagingList: React.FC = () => {
  const { packages, navigateTo } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đóng gói sản phẩm & Mã QR"
        voiceText="Đây là danh sách các gói sản phẩm đã được đóng gói và dán mã QR truy xuất nguồn gốc. Bác có thể bấm nút Tạo mã mới để sinh mã QR dán bao bì."
      />

      <div className="p-4 space-y-4">
        {/* Chuỗi 2 công đoạn */}
        <PostHarvestWorkflowTabs activeTab="packaging" />

        {/* Action Banner */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex items-center justify-between gap-3">
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
        </div>

        {/* List of Packaged items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Sản phẩm đã tạo mã QR</h3>
            <span className="text-xs text-slate-500 font-semibold">{packages.length} lô</span>
          </div>

          {packages.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
              <span className="text-5xl">📦</span>
              <h4 className="text-xl font-bold text-slate-800">Chưa có mã đóng gói nào</h4>
              <p className="text-sm text-slate-500">
                Bác hãy bấm nút "Tạo mã mới" để đóng gói lô thu hoạch nhé.
              </p>
            </div>
          ) : (
            packages.map((pkg) => {
              const hasProc = pkg.processingSnapshot?.hasProcessing || !!pkg.processingLotId;
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
