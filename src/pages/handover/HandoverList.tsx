import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { ProductHandover } from '../../types';

const groups: Array<{ status: ProductHandover['status']; label: string }> = [
  { status: 'cho_kiem_nhan', label: 'Chờ kiểm nhận' },
  { status: 'da_kiem_nhan', label: 'Đã kiểm nhận' },
  { status: 'tu_choi', label: 'Từ chối' },
];

export const HandoverList: React.FC = () => {
  const { handovers, currentRole, currentUser, currentHTX, navigateTo, screenParams } = useApp();
  const [active, setActive] = useState<ProductHandover['status']>(
    groups.some((group) => group.status === screenParams?.status) ? screenParams.status : 'cho_kiem_nhan'
  );
  const visible = handovers.filter((item) => item.htxId === currentHTX.id &&
    (currentRole === 'R02' || currentRole === 'R04' || (currentRole === 'R06' && item.senderId === currentUser.id) || (currentRole === 'R03' && (item.actorId === currentUser.id || item.createdBy === currentUser.name))));
  const list = visible.filter((item) => item.status === active);

  return <div className="pb-24 bg-slate-50 min-h-screen">
    <Header title="Phiếu giao HTX" voiceText="Chọn nhóm trạng thái, rồi chạm phiếu để xem kết quả giao nhận." />
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {groups.map((group) => <button key={group.status} type="button" onClick={() => setActive(group.status)}
          className={`min-h-16 rounded-2xl border-2 p-2 text-sm font-extrabold ${active === group.status ? 'bg-blue-700 border-blue-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          {group.label}<span className="block text-xs mt-1">{visible.filter((item) => item.status === group.status).length} phiếu</span>
        </button>)}
      </div>
      {list.length === 0 && <p className="rounded-2xl bg-white border p-5 text-center text-slate-600">Không có phiếu trong nhóm này.</p>}
      {list.map((item) => <button key={item.id} type="button" onClick={() => navigateTo('handover_detail', { handoverId: item.id })}
        className="w-full rounded-2xl bg-white border-2 border-slate-200 p-4 text-left space-y-2 shadow-sm">
        <div className="flex justify-between items-center gap-2">
          <strong className="text-blue-900 font-mono">{item.code}</strong>
          <span className="text-xs font-bold text-slate-500">{item.createdAt.slice(0, 10)}</span>
        </div>
        {item.onBehalfOfFarmer && (
          <div className="flex flex-wrap gap-1">
            <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
              ✍️ Cán bộ {item.actorName || item.createdBy || 'R03'} ghi thay
            </span>
            {item.isDraft && (
              <span className="inline-block bg-red-100 text-red-700 border border-red-300 text-xs px-2 py-0.5 rounded-full font-bold">
                ⏳ Bản nháp
              </span>
            )}
          </div>
        )}
        <p className="font-bold text-slate-900">{item.senderName} • {item.harvestLotCode}</p>
        <p className="text-sm text-slate-700">{item.handoverType === 'mua_dut' ? 'Mua đứt' : 'Ký gửi'} • Hộ khai {item.declaredQuantity} {item.unit}</p>
        <p className="text-sm font-semibold text-emerald-800">HTX thực nhận: {item.receivedQuantity === undefined ? 'Chưa cân' : `${item.receivedQuantity} ${item.unit}`}</p>
      </button>)}
    </div>
  </div>;
};
