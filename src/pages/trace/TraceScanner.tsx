import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const TraceScanner: React.FC = () => {
  const { navigateTo, speakText } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScanCode = (sampleCode: string) => {
    setIsScanning(true);
    speakText('Đang tra cứu dữ liệu nguồn gốc theo mã số tem...');
    setTimeout(() => {
      setIsScanning(false);
      navigateTo('trace_result', { code: sampleCode });
    }, 500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      alert('Vui lòng nhập mã QR hoặc mã tem truy xuất');
      return;
    }
    handleScanCode(manualCode.trim());
  };

  return (
    <div className="pb-24 bg-slate-900 min-h-screen text-white flex flex-col justify-between">
      <Header
        title="Quét mã nguồn gốc"
        voiceText="Bác hãy đưa camera điện thoại hướng vào mã QR dán trên bao bì sản phẩm nông sản để xem thông tin nguồn gốc nhé."
      />

      <div className="p-4 flex-1 flex flex-col items-center justify-center space-y-5">
        {/* Scanner Viewfinder Box */}
        <div className="relative w-64 h-64 rounded-3xl border-4 border-emerald-400 overflow-hidden bg-black/40 backdrop-blur shadow-2xl flex items-center justify-center">
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
              {isScanning ? 'Đang nhận diện mã...' : 'Đưa camera vào ô vuông này'}
            </p>
          </div>
        </div>

        {/* Guidance caption */}
        <div className="text-center max-w-xs space-y-0.5">
          <p className="text-base font-bold text-white">
            Giữ yên camera cách tem 15-20cm
          </p>
          <p className="text-xs text-slate-400">
            Hỗ trợ chuẩn tem QR VietGAP, OCOP Hưng Yên
          </p>
        </div>

        {/* Manual Code Input Form */}
        <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Hoặc nhập mã tem (VD: TXNG-HY...)"
              className="flex-1 px-3.5 py-3 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow text-white flex-shrink-0"
            >
              Kiểm tra
            </button>
          </div>
        </form>

        {/* 1-Tap Sample QR buttons for quick review */}
        <div className="w-full max-w-sm bg-slate-800/90 rounded-3xl p-4 border border-slate-700 space-y-2">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider text-center">
            Mã mẫu có sẵn trên hệ thống:
          </div>

          <button
            onClick={() => handleScanCode('TXNG-HY-AN-BT7-089')}
            className="w-full p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🌾</span>
              <span>Gạo Bắc Thơm An Ninh (5kg)</span>
            </div>
            <span className="text-[11px] opacity-80">Quét ➜</span>
          </button>

          <button
            onClick={() => handleScanCode('TXNG-HY-AN-ST25-045')}
            className="w-full p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🌾</span>
              <span>Gạo thượng hạng ST25 Hưng Yên</span>
            </div>
            <span className="text-[11px] opacity-80">Quét ➜</span>
          </button>

          <button
            onClick={() => handleScanCode('TXNG-HY-DT-GA-012')}
            className="w-full p-2.5 rounded-xl bg-orange-700 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🐓</span>
              <span>Gà Đông Tảo thuần chủng tiến vua</span>
            </div>
            <span className="text-[11px] opacity-80">Quét ➜</span>
          </button>

          <button
            onClick={() => handleScanCode('TXNG-HY-QT-NHAN-005')}
            className="w-full p-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>🍈</span>
              <span>Nhãn lồng tiến vua Quyết Thắng</span>
            </div>
            <span className="text-[11px] opacity-80">Quét ➜</span>
          </button>

          {/* Test invalid code button */}
          <button
            onClick={() => handleScanCode('TXNG-TEST-FAKE-999')}
            className="w-full p-2.5 rounded-xl bg-red-900/60 hover:bg-red-900/80 border border-red-500/50 active:scale-95 text-red-200 font-bold text-xs text-left flex items-center justify-between shadow"
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>Mã giả / không hợp lệ (Thử nghiệm)</span>
            </div>
            <span className="text-[11px] text-red-400">Test lỗi ➜</span>
          </button>
        </div>
      </div>
    </div>
  );
};
