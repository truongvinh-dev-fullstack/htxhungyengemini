import React from 'react';
import { useApp } from '../context/AppContext';

export const VoiceModal: React.FC = () => {
  const { voiceMessage, isSpeaking, stopSpeaking, speakText } = useApp();

  if (!voiceMessage) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-[440px] mx-auto bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl flex-shrink-0 animate-bounce">
          🔊
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
              {isSpeaking ? 'Trợ lý giọng nói đang đọc' : 'Nội dung trợ giúp'}
            </span>
            <button
              onClick={stopSpeaking}
              className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-base text-slate-800 font-medium leading-relaxed">
            "{voiceMessage}"
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => speakText(voiceMessage)}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5"
            >
              <span>🔄</span> Đọc lại
            </button>
            <button
              onClick={stopSpeaking}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-sm font-bold"
            >
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
