import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const TraceScanner: React.FC = () => {
  const { navigateTo, speakText } = useApp();
  const [isScanning, setIsScanning] = useState(false);

  const handleScanCode = (sampleCode: string) => {
    setIsScanning(true);
    speakText('Đã nhận diện mã QR sản phẩm. Đang mở thông tin nguồn gốc.');
    setTimeout(() => {
      setIsScanning(false);
      navigateTo('trace_result', { code: sampleCode });
    }, 600);
  };

  return (
    <div className="pb-24 bg-slate-900 min-h-screen text-white flex flex-col justify-between">
      <Header
        title="Quét mã nguồn gốc"
        voiceText="Bác hãy đưa camera điện thoại hướng vào mã QR dán trên bao bì sản phẩm nông sản để xem thông tin nguồn gốc nhé."
      />

      <div className="p-4 flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Scanner Viewfinder Box */}
        <div className="relative w-72 h-72 rounded-3xl border-4 border-emerald-400 overflow-hidden bg-black/40 backdrop-blur shadow-2xl flex items-center justify-center">
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
          <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>

          {/* Animated scan beam */}
          <div className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-bounce w-full"></div>

          <div className="text-center p-4">
            <span className="text-5xl opacity-80">📷</span>
            <p className="text-sm font-bold text-emerald-200 mt-2">
              Đưa camera vào ô vuông này
            </p>
          </div>
        </div>

        {/* Guidance caption for elderly */}
        <div className="text-center max-w-xs space-y-1">
          <p className="text-lg font-bold text-white">
            Giữ yên điện thoại cách tem 15-20cm
          </p>
          <p className="text-xs text-slate-300">
            Hệ thống sẽ tự động quét mã QR trên bao bì sản phẩm HTX Hưng Yên
          </p>
        </div>

        {/* 1-Tap Sample QR buttons for quick review */}
        <div className="w-full max-w-sm bg-slate-800/90 rounded-3xl p-4 border border-slate-700 space-y-2">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider text-center">
            Hoặc chạm để thử quét mã mẫu có sẵn:
          </div>

          <button
            onClick={() => handleScanCode('TXNG-HY-AN-BT7-089')}
            className="w-full p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🌾</span>
              <span>Gạo sạch Bắc Thơm An Ninh (5kg)</span>
            </div>
            <span>Quét ➜</span>
          </button>

          <button
            onClick={() => handleScanCode('TXNG-HY-DT-GA-012')}
            className="w-full p-3 rounded-2xl bg-orange-700 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🐓</span>
              <span>Gà Đông Tảo thuần chủng biếu Tết</span>
            </div>
            <span>Quét ➜</span>
          </button>

          <button
            onClick={() => handleScanCode('TXNG-HY-QT-NHAN-005')}
            className="w-full p-3 rounded-2xl bg-amber-700 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🍈</span>
              <span>Nhãn lồng tiến vua Quyết Thắng</span>
            </div>
            <span>Quét ➜</span>
          </button>
        </div>
      </div>
    </div>
  );
};
