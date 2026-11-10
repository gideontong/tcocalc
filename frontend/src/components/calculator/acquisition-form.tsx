import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { AcquisitionType, PowertrainType, TCOInput } from "@/lib/tco";
import { cn } from "@/lib/utils";
import { PowertrainSelector } from "./powertrain-selector";

const DOWN_PAYMENT_PRESETS = [0, 0.1, 0.15, 0.2] as const;
const LOAN_TERM_PRESETS = [36, 48, 60, 72] as const;

function presetPillClass(isSelected: boolean): string {
  return cn(
    "px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all",
    isSelected
      ? "bg-primary text-primary-foreground border-primary shadow-xs"
      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
  );
}

export interface AcquisitionFormProps {
  input: TCOInput;
  onAcquisitionModeChange: (mode: AcquisitionType) => void;
  onVehicleNameChange: (name: string) => void;
  onPowertrainChange: (powertrain: PowertrainType) => void;
  onNumberFieldChange: (field: keyof TCOInput, val: string) => void;
  onLeaseFieldChange: (field: keyof NonNullable<TCOInput["lease"]>, val: string | number | boolean) => void;
}

export function AcquisitionForm({
  input,
  onAcquisitionModeChange,
  onVehicleNameChange,
  onPowertrainChange,
  onNumberFieldChange,
  onLeaseFieldChange,
}: AcquisitionFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <CardTitle>Acquisition & Vehicle Details</CardTitle>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {input.acquisition}
            </span>
          </div>
          <CardDescription>Select acquisition method and customize vehicle pricing.</CardDescription>
        </div>

        {/* Segmented Tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mt-3">
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("cash")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "cash"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Cash Purchase
          </button>
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("loan")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "loan"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Loan Financing
          </button>
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("lease")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "lease"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Vehicle Lease
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="vehicleName">Vehicle Name</Label>
          <Input
            id="vehicleName"
            value={input.vehicleName}
            onChange={(e) => onVehicleNameChange(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1.5 block">Powertrain</Label>
          <PowertrainSelector
            value={input.powertrain}
            onChange={onPowertrainChange}
          />
        </div>

        <div>
          <Label htmlFor="purchasePrice">
            {input.acquisition === "lease" ? "MSRP / Agreed Price ($)" : "Purchase Price ($)"}
          </Label>
          <NumericInput
            id="purchasePrice"
            value={input.purchasePrice}
            onValueChange={(raw) => onNumberFieldChange("purchasePrice", raw)}
          />
        </div>

        {/* Conditional Fields: Cash Mode */}
        {input.acquisition === "cash" && (
          <div>
            <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
            <NumericInput
              id="salesTaxRate"
              step="0.1"
              value={input.salesTaxRate}
              onValueChange={(raw) => onNumberFieldChange("salesTaxRate", raw)}
            />
          </div>
        )}

        {/* Conditional Fields: Loan Mode */}
        {input.acquisition === "loan" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="downPayment">Down Payment ($)</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {input.purchasePrice > 0
                      ? `${((input.downPayment / input.purchasePrice) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DOWN_PAYMENT_PRESETS.map((pct) => {
                    const targetAmount = Math.round(input.purchasePrice * pct);
                    const isSelected =
                      pct === 0
                        ? input.downPayment === 0
                        : input.purchasePrice > 0 && input.downPayment === targetAmount;
                    return (
                      <button
                        key={pct}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onNumberFieldChange("downPayment", String(targetAmount))}
                        className={presetPillClass(isSelected)}
                      >
                        {Math.round(pct * 100)}%
                      </button>
                    );
                  })}
                </div>
                <NumericInput
                  id="downPayment"
                  value={input.downPayment}
                  onValueChange={(raw) => onNumberFieldChange("downPayment", raw)}
                />
              </div>
              <div>
                <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
                <NumericInput
                  id="salesTaxRate"
                  step="0.1"
                  value={input.salesTaxRate}
                  onValueChange={(raw) => onNumberFieldChange("salesTaxRate", raw)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="loanTermMonths">Loan Term (Months)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LOAN_TERM_PRESETS.map((months) => {
                    const isSelected = input.loanTermMonths === months;
                    return (
                      <button
                        key={months}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onNumberFieldChange("loanTermMonths", String(months))}
                        className={presetPillClass(isSelected)}
                      >
                        {months} mo
                      </button>
                    );
                  })}
                </div>
                <NumericInput
                  id="loanTermMonths"
                  max={240}
                  integer
                  value={input.loanTermMonths}
                  onValueChange={(raw) => onNumberFieldChange("loanTermMonths", raw)}
                />
              </div>
              <div>
                <Label htmlFor="loanInterestRate">Loan Interest APR (%)</Label>
                <NumericInput
                  id="loanInterestRate"
                  step="0.1"
                  value={input.loanInterestRate}
                  onValueChange={(raw) => onNumberFieldChange("loanInterestRate", raw)}
                />
              </div>
            </div>
          </>
        )}

        {/* Conditional Fields: Lease Mode */}
        {input.acquisition === "lease" && input.lease && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueAtSigning">Due at Signing ($)</Label>
                <NumericInput
                  id="dueAtSigning"
                  value={input.lease.dueAtSigning}
                  onValueChange={(_, num) => onLeaseFieldChange("dueAtSigning", num)}
                />
              </div>
              <div>
                <Label htmlFor="leaseTermMonths">Lease Term (Months)</Label>
                <NumericInput
                  id="leaseTermMonths"
                  min={1}
                  max={120}
                  integer
                  fallback={36}
                  value={input.lease.leaseTermMonths}
                  onValueChange={(_, num) => onLeaseFieldChange("leaseTermMonths", num)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyPayment">Direct Monthly Quote ($)</Label>
                <NumericInput
                  id="monthlyPayment"
                  value={input.lease.monthlyPayment}
                  placeholder="e.g. 450"
                  onValueChange={(_, num) => onLeaseFieldChange("monthlyPayment", num)}
                />
              </div>
              <div>
                <Label htmlFor="salesTaxRate">Monthly Sales Tax (%)</Label>
                <NumericInput
                  id="salesTaxRate"
                  step="0.1"
                  value={input.salesTaxRate}
                  onValueChange={(raw) => onNumberFieldChange("salesTaxRate", raw)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annualMileageLimit">Annual Mileage Limit</Label>
                <NumericInput
                  id="annualMileageLimit"
                  integer
                  fallback={12000}
                  value={input.lease.annualMileageLimit}
                  onValueChange={(_, num) => onLeaseFieldChange("annualMileageLimit", num)}
                />
              </div>
              <div>
                <Label htmlFor="excessMileageFeeRate">Excess Mileage Fee ($/mi)</Label>
                <NumericInput
                  id="excessMileageFeeRate"
                  step="0.05"
                  fallback={0.25}
                  value={input.lease.excessMileageFeeRate}
                  onValueChange={(_, num) => onLeaseFieldChange("excessMileageFeeRate", num)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dispositionFee">Disposition Fee ($)</Label>
                <NumericInput
                  id="dispositionFee"
                  fallback={395}
                  value={input.lease.dispositionFee}
                  onValueChange={(_, num) => onLeaseFieldChange("dispositionFee", num)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  id="buyoutAtEnd"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={input.lease.buyoutAtEnd}
                  onChange={(e) => onLeaseFieldChange("buyoutAtEnd", e.target.checked)}
                />
                <Label htmlFor="buyoutAtEnd" className="text-xs font-normal">
                  Exercise purchase buyout at lease end
                </Label>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
