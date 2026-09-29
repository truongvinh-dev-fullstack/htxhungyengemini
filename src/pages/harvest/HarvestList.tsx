import React, { useState, useEffect, useMemo } from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { PostHarvestWorkflowTabs } from '../../components/PostHarvestWorkflowTabs';
import { canOpenHarvestCreateScreen, canViewHarvestLot } from '../../utils/permissions';
import { getHarvestBalance } from '../../utils/harvestBalance';

export const HarvestList: React.FC = () => {
  const { harvests, handovers, orders, members, currentHTX, currentRole, currentUser, navigateTo } = useApp();
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Đổi HTX hoặc vai trò phải đặt lại bộ lọc
  useEffect(() => {
    setOwnerFilter('all');
  }, [currentHTX.id, currentRole]);

  const canCreate = canOpenHarvestCreateScreen(currentRole);

  // Danh sách hộ để lọc cho R03 và R04
  const farmerFilterOptions = useMemo(() => {
    if (currentRole === 'R03') {
      const map = new Map<string, string>();
      // 1. Ưu tiên lấy tên chuẩn từ hồ sơ thành viên HTX
      members
        .filter((m) => m.htxId === currentHTX.id && m.role === 'R06')
        .forEach((m) => map.set(m.id, getCanonicalMemberName(m.id, m.name, members)));
      // 2. Bổ sung các hộ có lô trong HTX nhưng chưa có trong members (không để lô cũ ghi đè tên chuẩn)
      harvests
        .filter((h) => h.htxId === currentHTX.id && h.ownerId)
        .forEach((h) => {
          if (!map.has(h.ownerId!)) {
            map.set(h.ownerId!, getCanonicalMemberName(h.ownerId!, h.ownerName, members));
          }
        });
      return [...map.entries()];
    }
    if (currentRole === 'R04') {
      const map = new Map<string, string>();
      harvests
        .filter((lot) => canViewHarvestLot(currentRole, lot, currentHTX.id, currentUser.id, handovers) && lot.ownerId)
        .forEach((lot) => {
          map.set(lot.ownerId!, getCanonicalMemberName(lot.ownerId!, lot.ownerName, members));
        });
      return [...map.entries()];
    }
    return [];
  }, [members, harvests, currentHTX.id, currentRole, currentUser.id, handovers]);

  const visibleHarvests = harvests.filter((lot) =>
    canViewHarvestLot(currentRole, lot, currentHTX.id, currentUser.id, handovers) &&
    (ownerFilter === 'all' || lot.ownerId === ownerFilter)
  );

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={
          currentRole === 'R03'
            ? 'Giám sát Thu hoạch'
            : currentRole === 'R04'
            ? 'Nguồn cung thu hoạch'
            : 'Quản lý thu hoạch'
        }
        voiceText={
          currentRole === 'R03'
            ? 'Màn Giám sát Thu hoạch của Cán bộ Kỹ thuật R03. Bác xem được toàn bộ lô thu hoạch của các hộ trong HTX và có thể lọc theo từng hộ.'
            : canCreate
            ? 'Đây là danh sách các lô thu hoạch. Bác có thể bấm Thêm lô để ghi sản lượng mới.'
            : 'Đây là danh sách lô thu hoạch thuộc Hợp tác xã hiện tại để xem nguồn cung và đối soát hàng.'
        }
      />

      <div className="p-4 space-y-4">
        {/* Chuỗi 2 công đoạn */}
        <PostHarvestWorkflowTabs activeTab="harvest" />

        {/* Bộ lọc theo hộ cho R03 và R04 */}
        {(currentRole === 'R04' || currentRole === 'R03') && (
          <label className="block rounded-2xl bg-white border-2 border-slate-200 p-3.5 text-sm font-bold shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-800">
                {currentRole === 'R03' ? '🔍 Giám sát theo hộ nông dân:' : '🔍 Lọc theo hộ gửi hàng:'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {ownerFilter === 'all' ? 'Tất cả' : 'Đang lọc 1 hộ'}
              </span>
            </div>
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="block w-full h-12 px-3 border-2 border-slate-300 rounded-xl bg-slate-50 font-extrabold text-slate-900 focus:outline-none"
            >
              <option value="all">
                {currentRole === 'R03' ? '🌾 Tất cả hộ trong HTX' : '🌾 Tất cả hộ gửi hàng'}
              </option>
              {farmerFilterOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  Hộ: {name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Action Banner */}
        {canCreate && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-lg font-extrabold text-orange-950">Ghi nhận thu hoạch</h3>
              <p className="text-xs text-orange-800 font-medium mt-0.5">
                {currentRole === 'R03'
                  ? 'Ghi nhận lô thu hoạch từ một hoặc nhiều thửa nguồn cho hộ'
                  : 'Chọn thửa MSVT → Phân loại Loại 1, 2 → Lưu lô'}
              </p>
            </div>
            <button
              onClick={() => navigateTo('harvest_add')}
              className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-1.5 shadow-md whitespace-nowrap"
            >
              <span className="text-xl">➕</span>
              <span>Thêm lô</span>
            </button>
          </div>
        )}

        {/* List of Harvests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">
              {currentRole === 'R03' ? 'Danh sách lô thu hoạch các hộ' : 'Lô đã thu hoạch'}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{visibleHarvests.length} lô</span>
          </div>

          {visibleHarvests.length === 0 && (
            <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-200 text-slate-500 font-medium">
              Không có lô thu hoạch nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {visibleHarvests.map((lot) => {
            const balance = getHarvestBalance(lot, handovers, orders);
            const isProcessed = lot.processingStatus === 'da_so_che';
            const isNoProcessing = lot.processingStatus === 'khong_so_che';
            const hasMultipleSources = lot.sources && lot.sources.length > 1;

            return (
              <div
                key={lot.id}
                onClick={() =>
                  navigateTo('harvest_detail', {
                    lot,
                    lotId: lot.id,
                    code: lot.code,
                  })
                }
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-orange-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={lot.photoUrl}
                    alt={lot.code}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="inline-block bg-orange-100 text-orange-900 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                        {lot.code}
                      </span>
                      {hasMultipleSources && (
                        <span className="inline-block bg-purple-100 text-purple-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {lot.sources!.length} thửa nguồn
                        </span>
                      )}
                      {lot.seasonName && (
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          🌾 {lot.seasonName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {lot.variety || 'Nông sản VietGAP'}
                    </h4>

                    {/* Hiển thị chủ hộ sở hữu */}
                    {lot.ownerId && (
                      <p className="text-xs text-blue-900 font-bold mt-0.5">
                        👤 Chủ hộ: {getCanonicalMemberName(lot.ownerId, lot.ownerName, members)}
                      </p>
                    )}

                    {/* Hiển thị các vùng/thửa nguồn */}
                    <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                      <strong className="text-slate-700">Nguồn: </strong>
                      {lot.sources && lot.sources.length > 0
                        ? lot.sources.map((s) => `${s.farmZoneName} (${s.quantity.toLocaleString()} ${s.unit})`).join('; ')
                        : `${lot.farmZoneName} (${lot.yieldQuantity.toLocaleString()} ${lot.unit})`}
                    </div>

                    <div className="text-base font-extrabold text-orange-800 mt-1">
                      Tổng sản lượng: {lot.yieldQuantity.toLocaleString()} {lot.unit}
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      HTX nhận: {balance.receivedQuantity.toLocaleString()} {lot.unit} • Chờ duyệt: {balance.pendingQuantity.toLocaleString()} {lot.unit} • Khả dụng: {balance.availableQuantity.toLocaleString()} {lot.unit}
                    </p>

                    {/* Phân loại Loại 1, 2 nếu có */}
                    {(lot.grade1Quantity !== undefined || lot.grade2Quantity !== undefined) && (
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        Loại 1: <strong className="text-slate-800">{lot.grade1Quantity?.toLocaleString() || 0} {lot.unit}</strong> • Loại 2: <strong className="text-slate-800">{lot.grade2Quantity?.toLocaleString() || 0} {lot.unit}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Status Badge & Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Ngày thu: <strong>{lot.date}</strong></span>
                    <span>•</span>
                    {isProcessed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓ Đã sơ chế
                      </span>
                    ) : isNoProcessing ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        Không sơ chế
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                        Chưa sơ chế
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-orange-700">Chi tiết ➜</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
