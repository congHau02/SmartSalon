import React, { useEffect } from "react";
import { Delete, RotateCcw } from "lucide-react";

export function PinPad({ pin = "", onChange, onComplete, disabled = false, isError = false }) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  const handleDigit = (d) => {
    if (disabled || pin.length >= 4) return;
    const nextPin = pin + d;
    onChange(nextPin);
    if (nextPin.length === 4 && onComplete) {
      onComplete(nextPin);
    }
  };

  const handleBackspace = () => {
    if (disabled || pin.length === 0) return;
    onChange(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, disabled]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 4-dot PIN visual indicator */}
      <div className={`flex items-center gap-3 py-2 ${isError ? "animate-shake" : ""}`}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                isFilled
                  ? "bg-pink-500 border-pink-400 scale-110 shadow-sm shadow-pink-500/50"
                  : "bg-slate-800/80 border-slate-600 scale-100"
              }`}
            />
          );
        })}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-pink-600 border border-slate-700/80 text-base font-semibold text-slate-100 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleClear}
          className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 active:bg-slate-600 border border-slate-700/50 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center disabled:opacity-30 cursor-pointer"
          title="Xóa hết"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit("0")}
          className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-pink-600 border border-slate-700/80 text-base font-semibold text-slate-100 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleBackspace}
          className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 active:bg-slate-600 border border-slate-700/50 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center disabled:opacity-30 cursor-pointer"
          title="Xóa một số"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
