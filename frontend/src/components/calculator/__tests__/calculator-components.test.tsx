import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AcquisitionForm,
  PowertrainSelector,
  UsageForm,
  SummaryCards,
  BreakdownCard,
  ScheduleTable,
  VehicleTable,
} from "../index";
import { DEFAULT_TCO_INPUT } from "@/lib/defaults";
import { calculateTCO, TCOInput, SavedVehicle } from "@/lib/tco";

const sampleLoanInput: TCOInput = { ...DEFAULT_TCO_INPUT };

const sampleGasInput: TCOInput = {
  ...DEFAULT_TCO_INPUT,
  vehicleName: "2024 Honda Civic",
  powertrain: "gas",
  fuelEconomyMPG: 32,
  fuelPricePerGal: 3.75,
};

const sampleLeaseInput: TCOInput = {
  ...DEFAULT_TCO_INPUT,
  acquisition: "lease",
  powertrain: "electric",
  efficiencyKWhPer100Mi: 25,
  electricityRatePerKWh: 0.16,
  lease: {
    leaseTermMonths: 36,
    dueAtSigning: 3500,
    monthlyPayment: 429,
    moneyFactor: 0.0022,
    residualPercent: 57.0,
    acquisitionFee: 695,
    dispositionFee: 395,
    annualMileageLimit: 12000,
    excessMileageFeeRate: 0.25,
    buyoutAtEnd: false,
  },
};

describe("Calculator Modular Components", () => {
  describe("PowertrainSelector", () => {
    it("renders all three options with appropriate aria-checked states", () => {
      render(<PowertrainSelector value="hybrid" onChange={vi.fn()} />);

      const gasRadio = screen.getByRole("radio", { name: "Gas" });
      const hybridRadio = screen.getByRole("radio", { name: "Hybrid" });
      const electricRadio = screen.getByRole("radio", { name: "Electric" });

      expect(gasRadio).toHaveAttribute("aria-checked", "false");
      expect(hybridRadio).toHaveAttribute("aria-checked", "true");
      expect(electricRadio).toHaveAttribute("aria-checked", "false");
    });

    it("triggers onChange when clicking a radio pill", () => {
      const onChange = vi.fn();
      render(<PowertrainSelector value="gas" onChange={onChange} />);

      fireEvent.click(screen.getByRole("radio", { name: "Electric" }));
      expect(onChange).toHaveBeenCalledWith("electric");
    });

    it("supports keyboard arrow navigation", () => {
      const onChange = vi.fn();
      render(<PowertrainSelector value="hybrid" onChange={onChange} />);

      const radiogroup = screen.getByRole("radiogroup", { name: "Powertrain" });

      fireEvent.keyDown(radiogroup, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("electric");

      fireEvent.keyDown(radiogroup, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith("gas");
    });
  });

  describe("AcquisitionForm", () => {
    it("renders loan mode and triggers callbacks", () => {
      const onModeChange = vi.fn();
      const onNameChange = vi.fn();
      const onPowertrainChange = vi.fn();
      const onNumberChange = vi.fn();
      const onLeaseChange = vi.fn();

      render(
        <AcquisitionForm
          input={sampleLoanInput}
          onAcquisitionModeChange={onModeChange}
          onVehicleNameChange={onNameChange}
          onPowertrainChange={onPowertrainChange}
          onNumberFieldChange={onNumberChange}
          onLeaseFieldChange={onLeaseChange}
        />
      );

      // Verify Loan elements
      expect(screen.getByLabelText(/Down Payment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Loan Term/i)).toBeInTheDocument();

      // Trigger mode switch
      fireEvent.click(screen.getByRole("button", { name: /Cash Purchase/i }));
      expect(onModeChange).toHaveBeenCalledWith("cash");

      // Change vehicle name
      const nameInput = screen.getByLabelText("Vehicle Name");
      fireEvent.change(nameInput, { target: { value: "2025 Test Model" } });
      expect(onNameChange).toHaveBeenCalledWith("2025 Test Model");

      // Switch powertrain via pill selector
      fireEvent.click(screen.getByRole("radio", { name: "Electric" }));
      expect(onPowertrainChange).toHaveBeenCalledWith("electric");

      // Change purchase price
      const priceInput = screen.getByLabelText(/Purchase Price/i);
      fireEvent.change(priceInput, { target: { value: "39000" } });
      expect(onNumberChange).toHaveBeenCalledWith("purchasePrice", "39000");
    });

    it("renders lease mode inputs and triggers lease callbacks", () => {
      const onLeaseChange = vi.fn();

      render(
        <AcquisitionForm
          input={sampleLeaseInput}
          onAcquisitionModeChange={vi.fn()}
          onVehicleNameChange={vi.fn()}
          onPowertrainChange={vi.fn()}
          onNumberFieldChange={vi.fn()}
          onLeaseFieldChange={onLeaseChange}
        />
      );

      expect(screen.getByLabelText(/Due at Signing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Direct Monthly Quote/i)).toBeInTheDocument();

      const signingInput = screen.getByLabelText(/Due at Signing/i);
      fireEvent.change(signingInput, { target: { value: "4000" } });
      expect(onLeaseChange).toHaveBeenCalledWith("dueAtSigning", 4000);

      const buyoutCheckbox = screen.getByLabelText(/Exercise purchase buyout/i);
      fireEvent.click(buyoutCheckbox);
      expect(onLeaseChange).toHaveBeenCalledWith("buyoutAtEnd", true);
    });
  });

  describe("UsageForm", () => {
    it("renders electric fields and responds to Recalculate click", () => {
      const onNumberChange = vi.fn();
      const onCalculate = vi.fn();

      render(
        <UsageForm
          input={sampleLeaseInput}
          onNumberFieldChange={onNumberChange}
          onCalculate={onCalculate}
        />
      );

      expect(screen.getByLabelText(/Efficiency \(kWh\/100mi\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Electricity Rate/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Recalculate/i }));
      expect(onCalculate).toHaveBeenCalled();
    });

    it("renders gas fields for gas powertrain", () => {
      render(
        <UsageForm
          input={sampleGasInput}
          onNumberFieldChange={vi.fn()}
          onCalculate={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Fuel Economy \(MPG\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Gas Price/i)).toBeInTheDocument();
    });
  });

  describe("SummaryCards", () => {
    it("renders metric values properly", () => {
      const result = calculateTCO(sampleLoanInput);
      render(<SummaryCards result={result} />);

      expect(screen.getByText("Monthly Average")).toBeInTheDocument();
      expect(screen.getByText("Cost Per Mile")).toBeInTheDocument();
      expect(screen.getByText("Net Ownership Cost")).toBeInTheDocument();
      expect(screen.getByText("Residual Value")).toBeInTheDocument();
    });
  });

  describe("BreakdownCard", () => {
    it("renders category breakdown items", () => {
      const result = calculateTCO(sampleLoanInput);
      render(<BreakdownCard result={result} />);

      expect(screen.getByText("Expense Category Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Depreciation")).toBeInTheDocument();
      expect(screen.getByText("Financing Interest")).toBeInTheDocument();
      expect(screen.getByText("Fuel / Electricity")).toBeInTheDocument();
    });
  });

  describe("ScheduleTable", () => {
    it("renders progression chart and table with yearly rows", () => {
      const result = calculateTCO(sampleLoanInput);
      render(<ScheduleTable result={result} />);

      expect(screen.getByText("Annual Progression Schedule")).toBeInTheDocument();
      expect(screen.getByLabelText("Progression Chart")).toBeInTheDocument();
      expect(screen.getByText("Loan Pay")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("VehicleTable", () => {
    it("renders empty state prompt when no vehicles are saved", () => {
      render(
        <VehicleTable
          vehicles={[]}
          selectedId={null}
          onSelectVehicle={vi.fn()}
          onAddVehicle={vi.fn()}
          onDeleteVehicle={vi.fn()}
        />
      );

      expect(screen.getByText(/No vehicles added to comparison yet/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Configured Vehicle/i })).toBeInTheDocument();
    });

    it("renders saved vehicle rows and handles selection, addition, and deletion", () => {
      const onSelect = vi.fn();
      const onAdd = vi.fn();
      const onDelete = vi.fn();

      const sampleVehicles: SavedVehicle[] = [
        {
          id: "v-1",
          input: sampleLoanInput,
          result: calculateTCO(sampleLoanInput),
          createdAt: 1000,
        },
        {
          id: "v-2",
          input: sampleGasInput,
          result: calculateTCO(sampleGasInput),
          createdAt: 2000,
        },
      ];

      render(
        <VehicleTable
          vehicles={sampleVehicles}
          selectedId="v-1"
          onSelectVehicle={onSelect}
          onAddVehicle={onAdd}
          onDeleteVehicle={onDelete}
        />
      );

      // Verify header and button
      expect(screen.getByText("Saved Vehicles")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Configured Vehicle/i })).toBeInTheDocument();

      // Verify active badge on first vehicle
      expect(screen.getByText("Active")).toBeInTheDocument();

      // Verify both vehicles rendered
      expect(screen.getByText("2024 Toyota RAV4 Hybrid")).toBeInTheDocument();
      expect(screen.getByText("2024 Honda Civic")).toBeInTheDocument();

      // Click second vehicle row to select it
      fireEvent.click(screen.getByText("2024 Honda Civic"));
      expect(onSelect).toHaveBeenCalledWith("v-2");

      // Click Add button
      fireEvent.click(screen.getByRole("button", { name: /Add Configured Vehicle/i }));
      expect(onAdd).toHaveBeenCalled();

      // Click Delete button on second vehicle
      const removeButtons = screen.getAllByRole("button", { name: /Delete/i });
      fireEvent.click(removeButtons[0]);
      expect(onDelete).toHaveBeenCalledWith("v-1");
    });
  });
});
