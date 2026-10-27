import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTCOCalculator, STORAGE_KEY } from "./use-tco-calculator";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import { toBase64 } from "@/lib/export";

describe("useTCOCalculator hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes with default vehicle input and calculated result", () => {
    const { result } = renderHook(() => useTCOCalculator());

    expect(result.current.state.input.vehicleName).toBe(DEFAULT_TCO_INPUT.vehicleName);
    expect(result.current.state.input.purchasePrice).toBe(DEFAULT_TCO_INPUT.purchasePrice);
    expect(result.current.state.result.netCostOfOwnership).toBeGreaterThan(0);
    expect(result.current.state.vehicles).toEqual([]);
    expect(result.current.state.selectedId).toBeNull();
  });

  it("adds a vehicle and automatically selects and compares it", () => {
    const { result } = renderHook(() => useTCOCalculator());

    act(() => {
      result.current.actions.addVehicle();
    });

    expect(result.current.state.vehicles.length).toBe(1);
    const added = result.current.state.vehicles[0];
    expect(result.current.state.selectedId).toBe(added.id);
    expect(result.current.state.comparedIds).toContain(added.id);
    expect(added.input.vehicleName).toBe(DEFAULT_TCO_INPUT.vehicleName);

    // Adding second vehicle
    act(() => {
      result.current.actions.addVehicle();
    });
    expect(result.current.state.vehicles.length).toBe(2);
    expect(result.current.state.vehicles[1].input.vehicleName).toBe("Vehicle 2");
    expect(result.current.state.comparedIds.length).toBe(2);
  });

  it("updates numeric fields and live recalculates the active vehicle", () => {
    const { result } = renderHook(() => useTCOCalculator());

    act(() => {
      result.current.actions.addVehicle();
    });

    const initialCost = result.current.state.result.netCostOfOwnership;

    act(() => {
      result.current.actions.updateNumberField("purchasePrice", "50000");
    });

    expect(result.current.state.input.purchasePrice).toBe(50000);
    expect(result.current.state.result.netCostOfOwnership).toBeGreaterThan(initialCost);
    expect(result.current.state.vehicles[0].input.purchasePrice).toBe(50000);
  });

  it("switches acquisition modes and adjusts financing parameters", () => {
    const { result } = renderHook(() => useTCOCalculator());

    act(() => {
      result.current.actions.addVehicle();
    });

    // Cash mode
    act(() => {
      result.current.actions.setAcquisitionMode("cash");
    });
    expect(result.current.state.input.acquisition).toBe("cash");
    expect(result.current.state.input.loanTermMonths).toBe(0);
    expect(result.current.state.result.categories.financingInterest).toBe(0);

    // Lease mode
    act(() => {
      result.current.actions.setAcquisitionMode("lease");
    });
    expect(result.current.state.input.acquisition).toBe("lease");
    expect(result.current.state.input.lease).toBeDefined();
    expect(result.current.state.input.lease?.leaseTermMonths).toBe(36);
  });

  it("toggles comparison selection for vehicles", () => {
    const { result } = renderHook(() => useTCOCalculator());

    act(() => {
      result.current.actions.addVehicle();
    });
    const vehicleId = result.current.state.vehicles[0].id;
    expect(result.current.state.comparedIds).toContain(vehicleId);

    act(() => {
      result.current.actions.toggleCompare(vehicleId);
    });
    expect(result.current.state.comparedIds).not.toContain(vehicleId);

    act(() => {
      result.current.actions.toggleCompare(vehicleId);
    });
    expect(result.current.state.comparedIds).toContain(vehicleId);
  });

  it("deletes a vehicle and adjusts selectedId", () => {
    const { result } = renderHook(() => useTCOCalculator());

    act(() => {
      result.current.actions.addVehicle(); // vehicle 1
      result.current.actions.addVehicle(); // vehicle 2
    });
    expect(result.current.state.vehicles.length).toBe(2);
    const idToDelete = result.current.state.vehicles[1].id;
    const remainingId = result.current.state.vehicles[0].id;

    act(() => {
      result.current.actions.deleteVehicle(idToDelete);
    });

    expect(result.current.state.vehicles.length).toBe(1);
    expect(result.current.state.vehicles[0].id).toBe(remainingId);
    expect(result.current.state.selectedId).toBe(remainingId);
  });

  it("hydrates saved vehicles from localStorage on mount", () => {
    const mockSaved = [
      {
        id: "saved-1",
        input: { ...DEFAULT_TCO_INPUT, vehicleName: "Hydrated Vehicle" },
        result: {
          input: { ...DEFAULT_TCO_INPUT, vehicleName: "Hydrated Vehicle" },
          acquisition: "loan",
          totalCostOfOwnership: 42000,
          residualValue: 10000,
          netCostOfOwnership: 32000,
          monthlyAverageCost: 533.33,
          costPerMile: 0.533,
          categories: {
            depreciation: 24500,
            financingInterest: 3000,
            fuelOrEnergy: 5000,
            insurance: 4000,
            maintenance: 2500,
            taxesAndFees: 3000,
          },
          yearly: [],
        },
        createdAt: 123456789,
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSaved));

    const { result } = renderHook(() => useTCOCalculator());

    expect(result.current.state.vehicles.length).toBe(1);
    expect(result.current.state.selectedId).toBe("saved-1");
    expect(result.current.state.input.vehicleName).toBe("Hydrated Vehicle");
    expect(result.current.state.result.netCostOfOwnership).toBe(32000);
  });

  it("hydrates vehicle from window.location.hash on mount", () => {
    const sharedInput = {
      ...DEFAULT_TCO_INPUT,
      vehicleName: "Shared Electric Beast",
      purchasePrice: 65000,
      powertrain: "electric" as const,
    };
    const hash = `#config=${toBase64(JSON.stringify(sharedInput))}`;
    window.location.hash = hash;

    const { result } = renderHook(() => useTCOCalculator());

    expect(result.current.state.input.vehicleName).toBe("Shared Electric Beast");
    expect(result.current.state.input.purchasePrice).toBe(65000);
    expect(result.current.state.input.powertrain).toBe("electric");
    expect(result.current.state.result.netCostOfOwnership).toBeGreaterThan(0);

    // Clean up hash
    window.location.hash = "";
  });
});
