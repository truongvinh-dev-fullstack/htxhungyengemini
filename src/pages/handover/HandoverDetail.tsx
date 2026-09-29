import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { ProductHandoverModal } from '../../components/ProductHandoverModal';
import { useApp } from '../../context/AppContext';
import { canConfirmHandover } from '../../utils/permissions';

export const HandoverDetail: React.FC = () => {
  const { handovers, harvests, productStocks, screenParams, currentHTX, currentRole, currentUser, goBack } = useApp();
  const [open, setOpen] = useState(false);
  const item = handovers.find((entry) => entry.id === screenParams?.handoverId && entry.htxId === currentHTX.id &&
    (canConfirmHandover(currentRole) || (currentRole === 'R06' && entry.senderId === currentUser.id) || (currentRole === 'R03' && (entry.actorId === currentUser.id || entry.createdBy === currentUser.name))));
  const lot = harvests.find((entry) => entry.id === item?.harvestLotId && entry.htxId === currentHTX.id);
  if (!item || !lot) return <div className="p-6 text-center">Không tìm thấy phiếu giao HTX trong phạm vi của bạn.<button onClick={goBack} className="block mx-auto mt-4 p-3 bg-slate-200 rounded-xl">Quay lại</button></div>;
  const stock = productStocks.find((entry) => entry.handoverId === item.id && entry.htxId === currentHTX.id);
  return <div className="pb-24 bg-slate-50 min-h-screen">
    <Header title="Chi tiết phiếu giao HTX" voiceText={`Phiếu ${item.code}, hộ khai ${item.declaredQuantity} ${item.unit}, trạng thái ${item.status}.`} />
    <div className="p-4 space-y-4">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 text-base">
        <h2 className="text-xl font-black text-blue-900">{item.code}</h2>
        {item.onBehalfOfFarmer && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-sm space-y-1">
            <p className="font-bold text-amber-900">✍️ Phiếu do cán bộ nhập thay hộ dân</p>
            <p className="text-amber-800"><strong>Người nhập thay:</strong> {item.actorName || item.createdBy || 'Cán bộ kỹ thuật R03'}</p>
            <p className="text-amber-800">
              <strong>Hình thức xác nhận:</strong>{' '}
              {item.confirmationMethod === 'truc_tiep'
                ? 'Gặp trực tiếp'
                : item.confirmationMethod === 'dien_thoai'
                ? 'Qua điện thoại'
                : item.confirmationMethod === 'giay_uy_quyen'
                ? 'Giấy ủy quyền'
                : 'Chưa có xác nhận'}
            </p>
            {item.confirmationTime && <p className="text-amber-800"><strong>Thời điểm xác nhận:</strong> {item.confirmationTime}</p>}
            {item.confirmationNote && <p className="text-amber-800"><strong>Ghi chú / bằng chứng:</strong> {item.confirmationNote}</p>}
            {item.isDraft && <p className="font-bold text-red-600">⏳ Trạng thái: Bản nháp chờ hộ xác nhận (chưa kiểm nhận)</p>}
          </div>
        )}
        <p><strong>Hộ giao:</strong> {item.senderName}</p>
        <p><strong>Lô nguồn:</strong> {item.harvestLotCode}</p>
        <p>
          <strong>Tình trạng hàng:</strong>{' '}
          {item.productState === 'da_dong_goi'
            ? `📦 Đã đóng gói (${item.packageSpec || '—'})`
            : item.productState === 'da_xu_ly'
            ? '⚙️ Hàng đã sơ chế'
            : '🌾 Hàng thô sau thu hoạch'}
        </p>
        {item.stockItemId && <p><strong>Dòng tồn nguồn:</strong> <span className="font-mono text-blue-900">{item.stockItemId}</span></p>}
        {item.packageCode && <p><strong>Mã lô đóng gói:</strong> <span className="font-mono text-emerald-900">{item.packageCode}</span></p>}
        {item.transportPackaging && <p><strong>Bao bì vận chuyển:</strong> <span className="text-amber-900 font-semibold">{item.transportPackaging}</span></p>}
        <p><strong>Hình thức:</strong> {item.handoverType === 'mua_dut' ? 'HTX mua đứt' : 'Hộ ký gửi, HTX bán hộ'}</p>
        <p><strong>Hộ khai:</strong> {item.declaredQuantity} {item.unit}{item.totalNetWeight ? ` (Quy đổi: ${item.totalNetWeight} kg)` : ''}</p>
        <p><strong>HTX thực nhận:</strong> {item.receivedQuantity === undefined ? 'Chưa kiểm nhận' : `${item.receivedQuantity} ${item.unit}`}</p>
        {item.differenceQuantity !== undefined && <p><strong>Chênh lệch:</strong> {item.differenceQuantity === 0 ? 'Khớp' : item.differenceQuantity > 0 ? `Thừa ${item.differenceQuantity} ${item.unit}` : `Thiếu ${-item.differenceQuantity} ${item.unit}`}</p>}
        <p><strong>Trạng thái:</strong> {item.status === 'cho_kiem_nhan' ? 'Chờ kiểm nhận' : item.status === 'da_kiem_nhan' ? 'Đã kiểm nhận' : 'Từ chối'}</p>
        {stock && <p><strong>Chủ hàng:</strong> {stock.ownerName} • <strong>Bên giữ:</strong> {stock.holderName || currentHTX.name}</p>}
        {item.qualityAssessment && <p><strong>Chất lượng:</strong> {item.qualityAssessment}</p>}
        {item.notes && <p><strong>Ghi chú:</strong> {item.notes}</p>}
      </div>
      {canConfirmHandover(currentRole) && item.status === 'cho_kiem_nhan' && <button type="button" onClick={() => setOpen(true)} className="w-full rounded-2xl bg-blue-700 text-white p-4 text-lg font-black">⚖️ Cân và kiểm nhận</button>}
    </div>
    <ProductHandoverModal isOpen={open} onClose={() => setOpen(false)} harvestLot={lot} handoverToConfirm={item} />
  </div>;
};
