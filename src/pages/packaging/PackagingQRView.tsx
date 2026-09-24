import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { PackagedProduct } from '../../types';

export const PackagingQRView: React.FC = () => {
  const { screenParams, currentHTX, goBack } = useApp();
  const pkg: PackagedProduct = screenParams?.pkg;

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
            <div>Số lượng đợt này: <strong>{pkg.packQuantity} {pkg.unit}</strong></div>
            <div className="text-xs text-slate-400">
              Đóng gói: {pkg.createdDate} • Hạn dùng: {pkg.expiryDate}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold">
            🔍 Quét mã bằng Zalo hoặc Camera để xem toàn bộ hành trình canh tác
          </div>
        </div>

        {/* 2 Big Action Buttons: Share Zalo & Print */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleShareZalo}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xl font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span className="text-2xl">💬</span>
            <span>CHIA SẺ QUA ZALO</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🖨️</span>
            <span>IN TEM MÃ QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
