import React from 'react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  voiceText?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true, voiceText }) => {
  const { goBack, speakText, isSpeaking, stopSpeaking, currentHTX, currentRole } = useApp();

  const handleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(voiceText || `Màn hình ${title}. Chúc bà con một ngày lao động thuận lợi, mùa màng bội thu.`);
    }
  };

  return (
    <header className="zalo-header px-3 py-3 shadow-md sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 active:scale-95 text-white px-3 py-2 rounded-xl text-base font-bold transition-all"
              aria-label="Quay lại"
            >
              <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Quay lại</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {currentHTX.logo}
            </div>
          )}
          <div className="truncate">
            <h1 className="text-xl font-bold text-white truncate leading-tight tracking-wide">{title}</h1>
            <p className="text-xs text-white/80 truncate font-medium">
              {currentHTX.shortName} • <span className="font-bold text-amber-200">{currentRole}</span>
            </p>
          </div>
        </div>

        {/* Voice Assistant Button */}
        <button
          onClick={handleVoice}
          title="Trợ giúp giọng nói"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
            isSpeaking
              ? 'bg-amber-400 text-amber-950 animate-pulse ring-2 ring-white'
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
        >
          <span className="text-lg">🔊</span>
          <span className="hidden sm:inline">{isSpeaking ? 'Đang đọc...' : 'Đọc to'}</span>
        </button>
      </div>
    </header>
  );
};
