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
  resetDefaults: () => void;
}

export interface UseTCOCalculatorReturn {
  state: TCOCalculatorState;
  actions: TCOCalculatorActions;
}

const SERVER_DEFAULT_STATE: TCOCalculatorState = {
  vehicles: [],
  selectedId: null,
  comparedIds: [],
  input: DEFAULT_TCO_INPUT,
  result: calculateTCO(DEFAULT_TCO_INPUT),
};

let cachedKey: string | null = null;
let cachedSnapshot: TCOCalculatorState = SERVER_DEFAULT_STATE;

function getClientInitialState(): TCOCalculatorState {
  if (typeof window === "undefined") {
    return SERVER_DEFAULT_STATE;
  }

  const hash = window.location.hash || "";
  let savedRaw = "";
  try {
    savedRaw = localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    savedRaw = "";
  }

  const key = `${hash}::${savedRaw}`;
  if (key === cachedKey) {
    return cachedSnapshot;
  }

  let nextSnapshot: TCOCalculatorState = SERVER_DEFAULT_STATE;

  // Check for shared URL configuration in hash first
  if (hash) {
    const shared = decodeShareableConfig(hash);
    if (shared) {
      try {
        const calc = calculateTCO(shared);
        let vehicles: SavedVehicle[] = [];
        let comparedIds: string[] = [];
        if (savedRaw) {
          const parsed: SavedVehicle[] = JSON.parse(savedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            vehicles = parsed;
            comparedIds = parsed.map((v) => v.id);
          }
        }
        nextSnapshot = {
          vehicles,
          selectedId: null,
          comparedIds,
          input: shared,
          result: calc,
        };
        cachedKey = key;
        cachedSnapshot = nextSnapshot;
        return nextSnapshot;
      } catch (err) {
        console.error("Failed to calculate shared vehicle configuration", err);
      }
    }
  }

  if (savedRaw) {
    try {
      const parsed: SavedVehicle[] = JSON.parse(savedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        nextSnapshot = {
          vehicles: parsed,
          selectedId: parsed[0].id,
          comparedIds: parsed.map((v) => v.id),
          input: parsed[0].input,
          result: parsed[0].result,
        };
      }
    } catch (err) {
      console.error("Failed to load saved vehicles from localStorage", err);
    }
  }

  cachedKey = key;
  cachedSnapshot = nextSnapshot;
  return nextSnapshot;
}

function getServerDefaultState(): TCOCalculatorState {
  return SERVER_DEFAULT_STATE;
}

function subscribeExternal(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("hashchange", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("storage", callback);
  };
}

function persistVehicles(vehicles: SavedVehicle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // ignore localStorage storage errors
  }
}

export function useTCOCalculator(): UseTCOCalculatorReturn {
  const hydratedState = React.useSyncExternalStore(
    subscribeExternal,
    getClientInitialState,
    getServerDefaultState
  );
  const [userState, setUserState] = React.useState<TCOCalculatorState | null>(null);

  const state = userState ?? hydratedState;

  const updateActiveInput = React.useCallback(
    (computeNextInput: (currentInput: TCOInput) => TCOInput) => {
      setUserState((prev) => {
        const cur = prev ?? getClientInitialState();
        const nextInput = computeNextInput(cur.input);
        try {
          const nextResult = calculateTCO(nextInput);
          let nextVehicles = cur.vehicles;
          if (cur.selectedId) {
            nextVehicles = cur.vehicles.map((v) =>
              v.id === cur.selectedId ? { ...v, input: nextInput, result: nextResult } : v
            );
            persistVehicles(nextVehicles);
          }
          return {
            ...cur,
            vehicles: nextVehicles,
            input: nextInput,
            result: nextResult,
          };
        } catch {
          return {
            ...cur,
            input: nextInput,
          };
        }
      });
    },
    []
  );

  const selectVehicle = React.useCallback((id: string) => {
    setUserState((prev) => {
      const cur = prev ?? getClientInitialState();
      const target = cur.vehicles.find((v) => v.id === id);
      if (!target) return cur;
      return {
        ...cur,
        selectedId: target.id,
        input: target.input,
        result: target.result,
      };
    });
  }, []);

  const addVehicle = React.useCallback(() => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `vehicle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    setUserState((prev) => {
      const cur = prev ?? getClientInitialState();
      let newVehicle: SavedVehicle;
      let nextInput = cur.input;
      let nextResult = cur.result;

      if (cur.vehicles.length === 0) {
        newVehicle = {
          id,
          input: { ...cur.input },
          result: { ...cur.result },
          createdAt: Date.now(),
        };
      } else {
        nextInput = {
          ...DEFAULT_TCO_INPUT,
          vehicleName: `Vehicle ${cur.vehicles.length + 1}`,
        };
        nextResult = calculateTCO(nextInput);
        newVehicle = {
          id,
          input: nextInput,
          result: nextResult,
          createdAt: Date.now(),
        };
      }

      const nextVehicles = [...cur.vehicles, newVehicle];
      persistVehicles(nextVehicles);

      return {
        vehicles: nextVehicles,
        selectedId: id,
        comparedIds: [...cur.comparedIds, id],
        input: nextInput,
        result: nextResult,
      };
    });
  }, []);

  const deleteVehicle = React.useCallback((id: string) => {
    setUserState((prev) => {
      const cur = prev ?? getClientInitialState();
      const nextVehicles = cur.vehicles.filter((v) => v.id !== id);
      persistVehicles(nextVehicles);

      let nextSelectedId = cur.selectedId;
      let nextInput = cur.input;
      let nextResult = cur.result;

      if (cur.selectedId === id) {
        if (nextVehicles.length > 0) {
          nextSelectedId = nextVehicles[0].id;
          nextInput = nextVehicles[0].input;
          nextResult = nextVehicles[0].result;
        } else {
          nextSelectedId = null;
        }
      }

      return {
        vehicles: nextVehicles,
        selectedId: nextSelectedId,
        comparedIds: cur.comparedIds.filter((item) => item !== id),
        input: nextInput,
        result: nextResult,
      };
    });
  }, []);

  const toggleCompare = React.useCallback((id: string) => {
    setUserState((prev) => {
      const cur = prev ?? getClientInitialState();
      const nextCompared = cur.comparedIds.includes(id)
        ? cur.comparedIds.filter((item) => item !== id)
        : [...cur.comparedIds, id];
      return {
        ...cur,
        comparedIds: nextCompared,
      };
    });
  }, []);

  const setAcquisitionMode = React.useCallback(
    (mode: AcquisitionType) => {
      updateActiveInput((currentInput) => {
        const next: TCOInput = { ...currentInput, acquisition: mode };
        if (mode === "cash") {
          next.loanTermMonths = 0;
          next.loanInterestRate = 0;
          next.downPayment = next.purchasePrice;
        } else if (mode === "loan") {
          if (next.loanTermMonths === 0) next.loanTermMonths = 60;
          if (next.loanInterestRate === 0) next.loanInterestRate = 5.5;
          if (next.downPayment === next.purchasePrice) {
            next.downPayment = Math.round(next.purchasePrice * 0.15);
          }
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
        return next;
      });
    },
    [updateActiveInput]
  );

  const calculate = React.useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      updateActiveInput((currentInput) => ({ ...currentInput }));
    },
    [updateActiveInput]
  );

  const resetDefaults = React.useCallback(() => {
    setUserState((prev) => {
      const cur = prev ?? getClientInitialState();
      const nextInput = { ...DEFAULT_TCO_INPUT };
      return {
        ...cur,
        selectedId: null,
        input: nextInput,
        result: calculateTCO(nextInput),
      };
    });
  }, []);

  const updateNumberField = React.useCallback(
    (field: keyof TCOInput, val: string) => {
      const parsed = parseFloat(val);
      let num = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      if (field === "ownershipYears") {
        num = Math.min(50, Math.max(1, Math.round(num)));
      } else if (field === "loanTermMonths") {
        num = Math.min(240, Math.round(num));
      }
      updateActiveInput((currentInput) => ({ ...currentInput, [field]: num }));
    },
    [updateActiveInput]
  );

  const updateBooleanField = React.useCallback(
    (field: keyof TCOInput, val: boolean) => {
      updateActiveInput((currentInput) => ({ ...currentInput, [field]: val }));
    },
    [updateActiveInput]
  );

  const updateLeaseField = React.useCallback(
    (field: keyof LeaseInput, val: string | number | boolean) => {
      updateActiveInput((currentInput) => {
        if (!currentInput.lease) return currentInput;
        let sanitized = val;
        if (typeof val === "number") {
          sanitized = Number.isFinite(val) ? Math.max(0, val) : 0;
          if (field === "leaseTermMonths") {
            sanitized = Math.min(120, Math.max(1, Math.round(sanitized)));
          }
        }
        const nextLease = { ...currentInput.lease, [field]: sanitized };
        const nextInput: TCOInput = { ...currentInput, lease: nextLease };
        if (field === "leaseTermMonths") {
          nextInput.ownershipYears = Math.max(1, Math.ceil(Number(sanitized) / 12));
        }
        return nextInput;
      });
    },
    [updateActiveInput]
  );

  const updateVehicleName = React.useCallback(
    (vehicleName: string) => {
      updateActiveInput((currentInput) => ({ ...currentInput, vehicleName }));
    },
    [updateActiveInput]
  );

  const updatePowertrain = React.useCallback(
    (powertrain: PowertrainType) => {
      updateActiveInput((currentInput) => {
        const next: TCOInput = { ...currentInput, powertrain };
        if (powertrain === "electric") {
          if (next.efficiencyKWhPer100Mi <= 0) {
            next.efficiencyKWhPer100Mi = 28;
          }
          if (next.electricityRatePerKWh <= 0) {
            next.electricityRatePerKWh = 0.16;
          }
        } else {
          if (next.fuelEconomyMPG <= 0) {
            next.fuelEconomyMPG = powertrain === "hybrid" ? 39 : 30;
          }
          if (next.fuelPricePerGal <= 0) {
            next.fuelPricePerGal = 3.8;
          }
        }
        return next;
      });
    },
    [updateActiveInput]
  );

  const updateTiming = React.useCallback(
    (incentiveTiming: IncentiveTiming) => {
      updateActiveInput((currentInput) => ({ ...currentInput, incentiveTiming }));
    },
    [updateActiveInput]
  );

  return {
    state,
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
      resetDefaults,
    },
  };
}
