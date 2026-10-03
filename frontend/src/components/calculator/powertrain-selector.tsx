import * as React from "react";
import { PowertrainType } from "@/lib/tco";
import { cn } from "@/lib/utils";

export interface PowertrainSelectorProps {
  value: PowertrainType;
  onChange: (value: PowertrainType) => void;
  disabled?: boolean;
}

const OPTIONS: { value: PowertrainType; label: string }[] = [
  { value: "gas", label: "Gas" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

export function PowertrainSelector({ value, onChange, disabled }: PowertrainSelectorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const currentIndex = OPTIONS.findIndex((opt) => opt.value === value);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % OPTIONS.length;
      onChange(OPTIONS[nextIndex].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + OPTIONS.length) % OPTIONS.length;
      onChange(OPTIONS[prevIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Powertrain"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 w-full",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
              isSelected
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
