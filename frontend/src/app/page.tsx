"use client";

import * as React from "react";
import { calculateTCO, AcquisitionType, PowertrainType, TCOInput, TCOResult } from "@/lib/tco";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import {
  AcquisitionForm,
  UsageForm,
  SummaryCards,
  BreakdownCard,
  ScheduleTable,
} from "@/components/calculator";

export default function Home() {
  const [input, setInput] = React.useState<TCOInput>(DEFAULT_TCO_INPUT);
  const [result, setResult] = React.useState<TCOResult>(() => calculateTCO(DEFAULT_TCO_INPUT));

  const setAcquisitionMode = (mode: AcquisitionType) => {
    const next: TCOInput = { ...input, acquisition: mode };
    if (mode === "cash") {
      next.loanTermMonths = 0;
      next.loanInterestRate = 0;
      next.downPayment = next.purchasePrice;
    } else if (mode === "loan") {
      if (next.loanTermMonths === 0) next.loanTermMonths = 60;
      if (next.loanInterestRate === 0) next.loanInterestRate = 5.5;
      if (next.downPayment === next.purchasePrice) next.downPayment = Math.round(next.purchasePrice * 0.15);
    } else if (mode === "lease") {
      if (!next.lease) {
        next.lease = {
          leaseTermMonths: 36,
          dueAtSigning: 3000,
          monthlyPayment: 450,
          moneyFactor: 0.0022,
          residualPercent: 55.0,
          acquisitionFee: 695,
          dispositionFee: 395,
          annualMileageLimit: 12000,
          excessMileageFeeRate: 0.25,
          buyoutAtEnd: false,
        };
      }
      next.ownershipYears = Math.ceil(next.lease.leaseTermMonths / 12);
    }
    setInput(next);
    setResult(calculateTCO(next));
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = calculateTCO(input);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const updateNumberField = (field: keyof TCOInput, val: string) => {
    const num = parseFloat(val) || 0;
    const nextInput = { ...input, [field]: num };
    setInput(nextInput);
    try {
      setResult(calculateTCO(nextInput));
    } catch {
      // ignore live validation error during partial edit
    }
  };

  const updateLeaseField = (field: keyof NonNullable<TCOInput["lease"]>, val: string | number | boolean) => {
    if (!input.lease) return;
    const nextLease = { ...input.lease, [field]: val };
    const nextInput: TCOInput = { ...input, lease: nextLease };
    if (field === "leaseTermMonths") {
      nextInput.ownershipYears = Math.ceil(Number(val) / 12);
    }
    setInput(nextInput);
    try {
      setResult(calculateTCO(nextInput));
    } catch {
      // ignore live validation error during partial edit
    }
  };

  const updateVehicleName = (vehicleName: string) => {
    setInput((prev) => ({ ...prev, vehicleName }));
  };

  const updatePowertrain = (powertrain: PowertrainType) => {
    const next = { ...input, powertrain };
    setInput(next);
    try {
      setResult(calculateTCO(next));
    } catch {
      // ignore live validation error during partial edit
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <main className="max-w-6xl mx-auto space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            tcocalc
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total Cost of Ownership (TCO) calculator for driving a vehicle across Cash, Loan, and Lease options.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 space-y-6">
            <AcquisitionForm
              input={input}
              onAcquisitionModeChange={setAcquisitionMode}
              onVehicleNameChange={updateVehicleName}
              onPowertrainChange={updatePowertrain}
              onNumberFieldChange={updateNumberField}
              onLeaseFieldChange={updateLeaseField}
            />

            <UsageForm
              input={input}
              onNumberFieldChange={updateNumberField}
              onCalculate={handleCalculate}
            />
          </div>

          {/* Right Column: Output Summary & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <SummaryCards result={result} />
            <BreakdownCard result={result} />
            <ScheduleTable result={result} />
          </div>
        </div>
      </main>
    </div>
  );
}
