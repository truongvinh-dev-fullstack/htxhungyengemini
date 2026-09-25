import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { StockTransaction } from '../../types';

export const StockTransactionDetail: React.FC = () => {
  const { screenParams, goBack, currentHTX } = useApp();
  const tx: StockTransaction = screenParams?.transaction;

  if (!tx) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy chứng từ kho.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const isImport = tx.type === 'import';

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isImport ? 'Phiếu nhập kho' : 'Phiếu xuất kho'}
        voiceText={`Chi tiết ${isImport ? 'phiếu nhập kho' : 'phiếu xuất kho'} mã số ${tx.code}. Số lượng ${tx.quantity} ${tx.unit} ${tx.itemName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Voucher Card */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-md space-y-4 font-sans">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-100 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {currentHTX.name}
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isImport ? 'PHIẾU NHẬP KHO VẬT TƯ' : 'PHIẾU XUẤT KHO CẤP PHÁT'}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl">
                Số: {tx.code}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                  isImport ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isImport ? 'Nhập kho' : 'Xuất kho'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Ngày lập phiếu:</span>
              <span className="font-bold text-slate-900">{tx.date}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">
                {isImport ? 'Nhà cung ứng / Đối tác:' : 'Hộ nhận / Vùng canh tác:'}
              </span>
              <span className="font-extrabold text-slate-900 text-right">
                {tx.recipientOrSupplier}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mặt hàng vật tư:</span>
              <span className="font-extrabold text-slate-900">{tx.itemName}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase">Số lượng:</span>
              <span
                className={`text-2xl font-black ${
                  isImport ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isImport ? '+' : '-'} {tx.quantity.toLocaleString()} {tx.unit}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Lý do / Ghi chú chứng từ:
              </span>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {tx.notes || 'Không có ghi chú thêm.'}
              </p>
            </div>
          </div>

          {/* Signature block */}
          <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <span className="font-bold block">Người nhận hàng</span>
              <span className="italic text-[11px] text-slate-400">(Ký, ghi rõ họ tên)</span>
              <div className="h-14 flex items-center justify-center font-bold text-slate-800">
                Đã nhận đủ
              </div>
            </div>
            <div>
              <span className="font-bold block">Thủ kho HTX</span>
              <span className="italic text-[11px] text-slate-400">(Ký, đóng dấu điện tử)</span>
              <div className="h-14 flex items-center justify-center font-bold text-emerald-800">
                ✓ Đã xác thực
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-base shadow flex items-center justify-center gap-2"
        >
          <span>🖨️</span>
          <span>In phiếu chứng từ kho</span>
        </button>
      </div>
    </div>
  );
};
