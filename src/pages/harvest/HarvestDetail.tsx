import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HarvestLot } from '../../types';
import { canManageProcessing } from '../../utils/permissions';
import { HarvestProcessingModal } from '../../components/HarvestProcessingModal';

export const HarvestDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo, diaries, harvests, currentRole } = useApp();
  const lotParam: HarvestLot = screenParams?.lot;

  // Tìm lô mới nhất từ state để cập nhật ngay khi sửa sơ chế
  const lot = harvests.find((h) => h.id === lotParam?.id) || lotParam;

  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);

  if (!lot) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy lô thu hoạch.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Nhật ký canh tác liên quan của thửa ruộng
  const relatedDiaries = diaries.filter(
    (d) => d.farmZoneId === lot.farmZoneId || d.farmZoneName === lot.farmZoneName
  );

  const isProcessed = lot.processingStatus === 'da_so_che' && !!lot.processingInfo;
  const isNoProcessing = lot.processingStatus === 'khong_so_che';
  const hasProcessingPerm = canManageProcessing(currentRole);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết thu hoạch"
        voiceText={`Chi tiết lô thu hoạch ${lot.code}, sản lượng ${lot.yieldQuantity} ${lot.unit} tại ${lot.farmZoneName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Photo and Info Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img src={lot.photoUrl} alt={lot.code} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-bold font-mono">
              {lot.code}
            </div>
            {lot.zoneCode && (
              <div className="absolute top-3 right-3 bg-orange-600/90 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                {lot.zoneCode}
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Vùng thu hoạch
                </span>
                {lot.seasonName && (
                  <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    🌾 {lot.seasonName}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                {lot.farmZoneName}
              </h2>
              <div className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-2">
                <span>Giống: <strong>{lot.variety || 'Đặc sản địa phương'}</strong></span>
                {lot.ownerName && (
                  <>
                    <span>•</span>
                    <span>Chủ hộ: <strong>{lot.ownerName}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Sản lượng đạt được */}
            <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-900 block">Tổng sản lượng thu hoạch:</span>
                <span className="text-3xl font-extrabold text-orange-950">
                  {lot.yieldQuantity.toLocaleString()} {lot.unit}
                </span>
              </div>
              <span className="text-4xl">🌾</span>
            </div>

            {/* Phân loại Loại 1, Loại 2 & Chỉ số chất lượng */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide">
                Chất lượng nông sản lúc thu hoạch
              </span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Khối lượng Loại 1:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {lot.grade1Quantity !== undefined ? lot.grade1Quantity.toLocaleString() : '—'} {lot.unit}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Khối lượng Loại 2:</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {lot.grade2Quantity !== undefined ? lot.grade2Quantity.toLocaleString() : '—'} {lot.unit}
                  </span>
                </div>
              </div>

              {lot.qualityMetric && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 block mb-0.5">Chỉ số chất lượng thực tế:</span>
                  <span className="font-semibold text-slate-900">{lot.qualityMetric}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Ngày thu hoạch</span>
                <span className="font-extrabold text-slate-900">{lot.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Mã số lô</span>
                <span className="font-extrabold text-slate-900 font-mono">{lot.code}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{lot.notes || 'Không có.'}</p>
            </div>
          </div>
        </div>

        {/* THÔNG TIN SƠ CHẾ NÔNG SẢN (Req 3 & 4) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Thông tin Sơ chế sau thu hoạch
              </h3>
            </div>
            {isProcessed ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                ✓ Đã sơ chế
              </span>
            ) : isNoProcessing ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs">
                Không sơ chế
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                Chưa sơ chế
              </span>
            )}
          </div>

          {isProcessed && lot.processingInfo ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Ngày sơ chế:</span>
                  <span className="font-extrabold text-slate-900">{lot.processingInfo.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Nội dung / Phương pháp:</span>
                  <span className="font-extrabold text-slate-900">{lot.processingInfo.method}</span>
                </div>
                {lot.processingInfo.operatorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Người thực hiện:</span>
                    <span className="font-bold text-slate-800">{lot.processingInfo.operatorName}</span>
                  </div>
                )}
              </div>

              {/* Bảng kết quả tính toán đầu vào / đầu ra / hao hụt / thu hồi */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Đưa vào sơ chế:</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {lot.processingInfo.inputQuantity.toLocaleString()} {lot.unit}
                  </span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">Sau sơ chế (Đầu ra):</span>
                  <span className="text-sm font-extrabold text-emerald-900">
                    {lot.processingInfo.outputQuantity.toLocaleString()} {lot.unit}
                  </span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                  <span className="text-[11px] text-amber-700 block">Hao hụt sơ chế:</span>
                  <span className="text-sm font-extrabold text-amber-900">
                    {lot.processingInfo.lossQuantity.toLocaleString()} {lot.unit}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold block">
                    ({lot.processingInfo.lossRatePercent}%)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Tỷ lệ thu hồi thành phẩm:</span>
                <span className="text-base font-extrabold text-blue-700">
                  {lot.processingInfo.recoveryRatePercent}%
                </span>
              </div>

              {lot.processingInfo.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-500">Ghi chú:</span> {lot.processingInfo.notes}
                </div>
              )}

              {lot.processingInfo.updatedAt && (
                <div className="text-[11px] text-slate-400 italic text-right">
                  Cập nhật: {lot.processingInfo.updatedAt.slice(0, 10)} bởi {lot.processingInfo.updatedBy || 'Cán bộ'}
                </div>
              )}
            </div>
          ) : isNoProcessing ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Lô nông sản này không qua công đoạn sơ chế.</p>
              <p>Nông sản tươi thu hoạch được đóng gói trực tiếp với khối lượng khả dụng: <strong>{lot.yieldQuantity.toLocaleString()} {lot.unit}</strong>.</p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Lô thu hoạch này chưa được ghi nhận sơ chế.</p>
              <p>Nông sản có thể được sơ chế (xay xát, sấy, hút chân không...) hoặc đóng gói trực tiếp nếu không cần sơ chế.</p>
            </div>
          )}

          {/* Nút thao tác Sơ chế cho người có quyền */}
          {hasProcessingPerm && (
            <button
              onClick={() => setIsProcessingModalOpen(true)}
              className="w-full py-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border-2 border-blue-300 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <span>✏️</span>
              <span>{isProcessed ? 'Chỉnh sửa thông tin sơ chế' : 'Ghi nhận sơ chế cho lô này'}</span>
            </button>
          )}
        </div>

        {/* CN-3.6.3: Khối Nhật ký canh tác liên quan của thửa */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>📖</span>
              <span>Nhật ký canh tác của thửa</span>
            </h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {relatedDiaries.length} bản ghi
            </span>
          </div>

          {relatedDiaries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">Chưa có bản ghi nhật ký canh tác cho thửa này.</p>
          ) : (
            <div className="space-y-2">
              {relatedDiaries.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigateTo('diary_detail', { entry: d })}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{d.workTypeName}</div>
                    <div className="text-[11px] text-slate-500">{d.date} • {d.createdBy}</div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700">Xem ➜</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action button: Đóng gói & Tạo mã QR từ lô này */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigateTo('packaging_add', { harvestLot: lot, harvestLotId: lot.id })}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-base font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <span>📦</span>
            <span>ĐÓNG GÓI & TẠO MÃ QR TỪ LÔ NÀY</span>
          </button>

          <button
            onClick={goBack}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl font-bold text-sm"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>

      {/* Modal Sơ chế chung */}
      <HarvestProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        harvestLot={lot}
      />
    </div>
  );
};
