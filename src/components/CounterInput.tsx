import React from 'react';

interface CounterInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit: string;
  label?: string;
}

export const CounterInput: React.FC<CounterInputProps> = ({
  value,
  onChange,
  step = 1,
  min = 1,
  max = 99999,
  unit,
  label,
}) => {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    } else {
      onChange(min);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-base font-bold text-slate-800">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Giảm"
          className="w-14 h-14 rounded-2xl bg-red-50 active:bg-red-200 border-2 border-red-300 text-red-700 disabled:opacity-40 disabled:border-slate-200 disabled:text-slate-400 flex items-center justify-center text-3xl font-extrabold shadow-sm"
        >
          －
        </button>

        <div className="flex-1 h-14 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center justify-center px-3">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              if (!isNaN(num)) onChange(Math.max(min, num));
            }}
            className="w-full text-center bg-transparent text-2xl font-extrabold text-slate-900 focus:outline-none"
          />
          <span className="text-base font-bold text-slate-600 ml-1 whitespace-nowrap">{unit}</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="Tăng"
          className="w-14 h-14 rounded-2xl bg-emerald-50 active:bg-emerald-200 border-2 border-emerald-400 text-emerald-800 disabled:opacity-40 flex items-center justify-center text-3xl font-extrabold shadow-sm"
        >
          ＋
        </button>
      </div>

      {/* Quick jump buttons for common quantities */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto">
        <span className="text-xs text-slate-500 font-medium">Chọn nhanh:</span>
        {[5, 10, 50, 100].map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => onChange(quick)}
            className={`px-3 py-1 rounded-lg text-sm font-bold border ${
              value === quick
                ? 'bg-agri-700 text-white border-agri-800'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            +{quick}
          </button>
        ))}
      </div>
    </div>
  );
};
