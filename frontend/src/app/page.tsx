"use client";

import * as React from "react";
import {
  calculateTCO,
  AcquisitionType,
  PowertrainType,
  TCOInput,
  TCOResult,
  SavedVehicle,
} from "@/lib/tco";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import {
  AcquisitionForm,
  UsageForm,
  SummaryCards,
  BreakdownCard,
  ScheduleTable,
  VehicleTable,
} from "@/components/calculator";

const STORAGE_KEY = "tcocalc_saved_vehicles";

export default function Home() {
  const [vehicles, setVehicles] = React.useState<SavedVehicle[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState<TCOInput>(DEFAULT_TCO_INPUT);
  const [result, setResult] = React.useState<TCOResult>(() => calculateTCO(DEFAULT_TCO_INPUT));

  // Load saved vehicles from localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedVehicle[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVehicles(parsed);
          setSelectedId(parsed[0].id);
          setInput(parsed[0].input);
          setResult(parsed[0].result);
        }
      }
    } catch (err) {
      console.error("Failed to load saved vehicles from localStorage", err);
    }
  }, []);

  // Sync state and live update the currently selected vehicle
  const syncVehicle = (nextInput: TCOInput, nextResult: TCOResult) => {
    setInput(nextInput);
    setResult(nextResult);

    if (selectedId) {
      setVehicles((prev) => {
        const updated = prev.map((v) =>
          v.id === selectedId ? { ...v, input: nextInput, result: nextResult } : v
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore localStorage storage errors
        }
        return updated;
      });
    }
  };

  const handleSelectVehicle = (id: string) => {
    const target = vehicles.find((v) => v.id === id);
    if (target) {
      setSelectedId(target.id);
      setInput(target.input);
      setResult(target.result);
    }
  };

  const handleAddVehicle = () => {
    const id = `vehicle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (vehicles.length === 0) {
      const newVehicle: SavedVehicle = {
        id,
        input: { ...input },
        result: { ...result },
        createdAt: Date.now(),
      };
      const nextVehicles = [newVehicle];
      setVehicles(nextVehicles);
      setSelectedId(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVehicles));
      } catch {
        // ignore localStorage storage errors
      }
    } else {
      const newVehicleInput: TCOInput = {
        ...DEFAULT_TCO_INPUT,
        vehicleName: `Vehicle ${vehicles.length + 1}`,
      };
      const newVehicleResult = calculateTCO(newVehicleInput);
      const newVehicle: SavedVehicle = {
        id,
        input: newVehicleInput,
        result: newVehicleResult,
        createdAt: Date.now(),
      };
      const nextVehicles = [...vehicles, newVehicle];
      setVehicles(nextVehicles);
      setSelectedId(id);
      setInput(newVehicleInput);
      setResult(newVehicleResult);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVehicles));
      } catch {
        // ignore localStorage storage errors
      }
    }
  };

  const handleDeleteVehicle = (id: string) => {
    const nextVehicles = vehicles.filter((v) => v.id !== id);
    setVehicles(nextVehicles);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVehicles));
    } catch {
      // ignore localStorage storage errors
    }

    if (selectedId === id) {
      if (nextVehicles.length > 0) {
        setSelectedId(nextVehicles[0].id);
        setInput(nextVehicles[0].input);
        setResult(nextVehicles[0].result);
      } else {
        setSelectedId(null);
      }
    }
  };

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
    const nextResult = calculateTCO(next);
    syncVehicle(next, nextResult);
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = calculateTCO(input);
      syncVehicle(input, res);
    } catch (err) {
      console.error(err);
    }
  };

  const updateNumberField = (field: keyof TCOInput, val: string) => {
    const num = parseFloat(val) || 0;
    const nextInput = { ...input, [field]: num };
    try {
      const nextResult = calculateTCO(nextInput);
      syncVehicle(nextInput, nextResult);
    } catch {
      setInput(nextInput);
    }
  };

  const updateLeaseField = (field: keyof NonNullable<TCOInput["lease"]>, val: string | number | boolean) => {
    if (!input.lease) return;
    const nextLease = { ...input.lease, [field]: val };
    const nextInput: TCOInput = { ...input, lease: nextLease };
    if (field === "leaseTermMonths") {
      nextInput.ownershipYears = Math.ceil(Number(val) / 12);
    }
    try {
      const nextResult = calculateTCO(nextInput);
      syncVehicle(nextInput, nextResult);
    } catch {
      setInput(nextInput);
    }
  };

  const updateVehicleName = (vehicleName: string) => {
    const nextInput = { ...input, vehicleName };
    try {
      const nextResult = calculateTCO(nextInput);
      syncVehicle(nextInput, nextResult);
    } catch {
      setInput(nextInput);
    }
  };

  const updatePowertrain = (powertrain: PowertrainType) => {
    const next = { ...input, powertrain };
    try {
      const nextResult = calculateTCO(next);
      syncVehicle(next, nextResult);
    } catch {
      setInput(next);
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

        {/* Saved Vehicles Comparison Table */}
        <VehicleTable
          vehicles={vehicles}
          selectedId={selectedId}
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
        />

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
