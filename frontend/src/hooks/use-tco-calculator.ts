"use client";

import * as React from "react";
import {
  calculateTCO,
  AcquisitionType,
  IncentiveTiming,
  LeaseInput,
  PowertrainType,
  TCOInput,
  TCOResult,
  SavedVehicle,
} from "@/lib/tco";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import { decodeShareableConfig } from "@/lib/export";

export const STORAGE_KEY = "tcocalc_saved_vehicles";

export interface TCOCalculatorState {
  vehicles: SavedVehicle[];
  selectedId: string | null;
  comparedIds: string[];
  input: TCOInput;
  result: TCOResult;
}

export interface TCOCalculatorActions {
  selectVehicle: (id: string) => void;
  addVehicle: () => void;
  deleteVehicle: (id: string) => void;
  toggleCompare: (id: string) => void;
  setAcquisitionMode: (mode: AcquisitionType) => void;
  updateNumberField: (field: keyof TCOInput, val: string) => void;
  updateBooleanField: (field: keyof TCOInput, val: boolean) => void;
  updateLeaseField: (field: keyof LeaseInput, val: string | number | boolean) => void;
  updateVehicleName: (name: string) => void;
  updatePowertrain: (powertrain: PowertrainType) => void;
  updateTiming: (timing: IncentiveTiming) => void;
  calculate: (e?: React.FormEvent) => void;
}

export interface UseTCOCalculatorReturn {
  state: TCOCalculatorState;
  actions: TCOCalculatorActions;
}

export function useTCOCalculator(): UseTCOCalculatorReturn {
  const [vehicles, setVehicles] = React.useState<SavedVehicle[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [comparedIds, setComparedIds] = React.useState<string[]>([]);
  const [input, setInput] = React.useState<TCOInput>(DEFAULT_TCO_INPUT);
  const [result, setResult] = React.useState<TCOResult>(() => calculateTCO(DEFAULT_TCO_INPUT));

  // Hydrate saved vehicles from URL hash or localStorage on mount
  React.useEffect(() => {
    // Check for shared URL configuration in hash first
    if (typeof window !== "undefined" && window.location.hash) {
      const shared = decodeShareableConfig(window.location.hash);
      if (shared) {
        try {
          const calc = calculateTCO(shared);
          setInput(shared);
          setResult(calc);
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed: SavedVehicle[] = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setVehicles(parsed);
              setComparedIds(parsed.map((v) => v.id));
            }
          }
          return;
        } catch (err) {
          console.error("Failed to calculate shared vehicle configuration", err);
        }
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedVehicle[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVehicles(parsed);
          setSelectedId(parsed[0].id);
          setInput(parsed[0].input);
          setResult(parsed[0].result);
          setComparedIds(parsed.map((v) => v.id));
        }
      }
    } catch (err) {
      console.error("Failed to load saved vehicles from localStorage", err);
    }
  }, []);

  // Sync state and live update the currently selected vehicle
  const syncVehicle = React.useCallback(
    (nextInput: TCOInput, nextResult: TCOResult) => {
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
    },
    [selectedId]
  );

  const selectVehicle = React.useCallback(
    (id: string) => {
      const target = vehicles.find((v) => v.id === id);
      if (target) {
        setSelectedId(target.id);
        setInput(target.input);
        setResult(target.result);
      }
    },
    [vehicles]
  );

  const addVehicle = React.useCallback(() => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `vehicle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    setVehicles((prev) => {
      let newVehicle: SavedVehicle;
      if (prev.length === 0) {
        newVehicle = {
          id,
          input: { ...input },
          result: { ...result },
          createdAt: Date.now(),
        };
      } else {
        const newVehicleInput: TCOInput = {
          ...DEFAULT_TCO_INPUT,
          vehicleName: `Vehicle ${prev.length + 1}`,
        };
        const newVehicleResult = calculateTCO(newVehicleInput);
        newVehicle = {
          id,
          input: newVehicleInput,
          result: newVehicleResult,
          createdAt: Date.now(),
        };
        setInput(newVehicleInput);
        setResult(newVehicleResult);
      }

      setSelectedId(id);
      setComparedIds((prevCompared) => [...prevCompared, id]);
      const nextVehicles = [...prev, newVehicle];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVehicles));
      } catch {
        // ignore localStorage storage errors
      }
      return nextVehicles;
    });
  }, [input, result]);

  const deleteVehicle = React.useCallback(
    (id: string) => {
      setVehicles((prev) => {
        const nextVehicles = prev.filter((v) => v.id !== id);
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
        return nextVehicles;
      });
      setComparedIds((prev) => prev.filter((item) => item !== id));
    },
    [selectedId]
  );

  const toggleCompare = React.useCallback((id: string) => {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const setAcquisitionMode = React.useCallback(
    (mode: AcquisitionType) => {
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
    },
    [input, syncVehicle]
  );

  const calculate = React.useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      try {
        const res = calculateTCO(input);
        syncVehicle(input, res);
      } catch (err) {
        console.error(err);
      }
    },
    [input, syncVehicle]
  );

  const updateNumberField = React.useCallback(
    (field: keyof TCOInput, val: string) => {
      const num = parseFloat(val) || 0;
      const nextInput = { ...input, [field]: num };
      try {
        const nextResult = calculateTCO(nextInput);
        syncVehicle(nextInput, nextResult);
      } catch {
        setInput(nextInput);
      }
    },
    [input, syncVehicle]
  );

  const updateBooleanField = React.useCallback(
    (field: keyof TCOInput, val: boolean) => {
      const nextInput = { ...input, [field]: val };
      try {
        const nextResult = calculateTCO(nextInput);
        syncVehicle(nextInput, nextResult);
      } catch {
        setInput(nextInput);
      }
    },
    [input, syncVehicle]
  );

  const updateLeaseField = React.useCallback(
    (field: keyof LeaseInput, val: string | number | boolean) => {
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
    },
    [input, syncVehicle]
  );

  const updateVehicleName = React.useCallback(
    (vehicleName: string) => {
      const nextInput = { ...input, vehicleName };
      try {
        const nextResult = calculateTCO(nextInput);
        syncVehicle(nextInput, nextResult);
      } catch {
        setInput(nextInput);
      }
    },
    [input, syncVehicle]
  );

  const updatePowertrain = React.useCallback(
    (powertrain: PowertrainType) => {
      const next = { ...input, powertrain };
      try {
        const nextResult = calculateTCO(next);
        syncVehicle(next, nextResult);
      } catch {
        setInput(next);
      }
    },
    [input, syncVehicle]
  );

  const updateTiming = React.useCallback(
    (incentiveTiming: IncentiveTiming) => {
      const next = { ...input, incentiveTiming };
      try {
        const nextResult = calculateTCO(next);
        syncVehicle(next, nextResult);
      } catch {
        setInput(next);
      }
    },
    [input, syncVehicle]
  );

  return {
    state: {
      vehicles,
      selectedId,
      comparedIds,
      input,
      result,
    },
    actions: {
      selectVehicle,
      addVehicle,
      deleteVehicle,
      toggleCompare,
      setAcquisitionMode,
      updateNumberField,
      updateBooleanField,
      updateLeaseField,
      updateVehicleName,
      updatePowertrain,
      updateTiming,
      calculate,
    },
  };
}
