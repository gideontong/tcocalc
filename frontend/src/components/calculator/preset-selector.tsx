import * as React from "react";
import { Button } from "@/components/ui/button";
import { PresetKey } from "@/lib/presets";

export interface PresetSelectorProps {
  onSelectPreset: (key: PresetKey) => void;
}

export function PresetSelector({ onSelectPreset }: PresetSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Presets:</span>
      <Button variant="outline" size="sm" onClick={() => onSelectPreset("cash")}>
        Gas Sedan (Cash)
      </Button>
      <Button variant="outline" size="sm" onClick={() => onSelectPreset("loan")}>
        Hybrid SUV (Loan)
      </Button>
      <Button variant="outline" size="sm" onClick={() => onSelectPreset("lease")}>
        Electric EV (Lease)
      </Button>
    </div>
  );
}
