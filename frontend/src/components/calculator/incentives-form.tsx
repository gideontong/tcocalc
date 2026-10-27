"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IncentiveTiming, TCOInput } from "@/lib/tco";
import { cn, formatCurrency } from "@/lib/utils";

export interface IncentivesFormProps {
  input: TCOInput;
  onNumberFieldChange: (field: keyof TCOInput, val: string) => void;
  onTimingChange: (timing: IncentiveTiming) => void;
}

export function IncentivesForm({
  input,
  onNumberFieldChange,
  onTimingChange,
}: IncentivesFormProps) {
  const federalCredit = input.taxCreditFederal || 0;
  const timing = input.incentiveTiming || "point_of_sale";
  const isElectric = input.powertrain === "electric";

  const handleSelectPreset = (amount: number) => {
    onNumberFieldChange("taxCreditFederal", amount.toString());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Incentives & EV Fees</CardTitle>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
            Rebates & Subsidies
          </span>
        </div>
        <CardDescription>
          Model federal clean vehicle credits, state rebates, and annual EV road-use fees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Federal Tax Credit & Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="taxCreditFederal">Federal Clean Vehicle Credit ($)</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {formatCurrency(federalCredit, { showCents: false })}
            </span>
          </div>

          {/* Quick-Pick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleSelectPreset(7500)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md border transition-all",
                federalCredit === 7500
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              +$7,500 (New EV)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(4000)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md border transition-all",
                federalCredit === 4000
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              +$4,000 (Used EV)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(0)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md border transition-all",
                federalCredit === 0
                  ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              $0 (None)
            </button>
          </div>

          <Input
            id="taxCreditFederal"
            type="number"
            step="250"
            value={input.taxCreditFederal ?? ""}
            placeholder="e.g. 7500"
            onChange={(e) => onNumberFieldChange("taxCreditFederal", e.target.value)}
          />
        </div>

        {/* State / Regional Rebate */}
        <div>
          <Label htmlFor="taxCreditState">State & Local Rebates ($)</Label>
          <Input
            id="taxCreditState"
            type="number"
            step="100"
            value={input.taxCreditState ?? ""}
            placeholder="e.g. 2000 (CO, CA, NY, utility rebate)"
            onChange={(e) => onNumberFieldChange("taxCreditState", e.target.value)}
          />
        </div>

        {/* Incentive Application Timing */}
        <div className="space-y-1.5">
          <Label>Incentive Application Timing</Label>
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => onTimingChange("point_of_sale")}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                timing === "point_of_sale"
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              Point of Sale (Price Cut)
            </button>
            <button
              type="button"
              onClick={() => onTimingChange("post_purchase")}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                timing === "post_purchase"
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              Post-Purchase (Year 1)
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {timing === "point_of_sale"
              ? "Dealer transfer: Lowers financed loan principal and saves cumulative interest."
              : "Tax return: Financed on full price; cash rebate received at end of Year 1."}
          </p>
        </div>

        {/* Annual EV Road-Use Surcharge */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <Label htmlFor="annualEVSurcharge" className={cn(isElectric && "font-semibold text-slate-900 dark:text-slate-100")}>
              Annual EV Road Surcharge ($/yr)
            </Label>
            {isElectric && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Applied to EVs
              </span>
            )}
          </div>
          <Input
            id="annualEVSurcharge"
            type="number"
            step="25"
            value={input.annualEVSurcharge ?? ""}
            placeholder={isElectric ? "e.g. 150 - 225" : "e.g. 0"}
            onChange={(e) => onNumberFieldChange("annualEVSurcharge", e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            State registration surcharge to offset gasoline taxes (e.g. TX $200/yr, CA $108/yr, WA $225/yr).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
