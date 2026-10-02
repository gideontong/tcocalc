import { describe, it, expect } from "vitest";
import { calculateTCO, TCOInput } from "./tco";

describe("TCO Calculation Engine", () => {
  it("calculates cash purchase accurately", () => {
    const input: TCOInput = {
      vehicleName: "2024 Honda Civic",
      powertrain: "gas",
      purchasePrice: 28000,
      downPayment: 28000,
      salesTaxRate: 7.0,
      loanTermMonths: 0,
      loanInterestRate: 0,
      ownershipYears: 5,
      annualMileage: 12000,
      fuelEconomyMPG: 32,
      fuelPricePerGal: 3.5,
      efficiencyKWhPer100Mi: 0,
      electricityRatePerKWh: 0,
      annualInsurance: 1400,
      annualMaintenance: 700,
      annualFees: 250,
      depreciationRate: 15.0,
    };

    const res = calculateTCO(input);
    expect(res.categories.financingInterest).toBe(0);
    expect(res.residualValue).toBeGreaterThan(0);
    expect(res.residualValue).toBeLessThan(input.purchasePrice);
    expect(res.monthlyAverageCost).toBeGreaterThan(0);
    expect(res.costPerMile).toBeGreaterThan(0);
    expect(res.yearly.length).toBe(5);
  });

  it("calculates financed electric vehicle accurately", () => {
    const input: TCOInput = {
      vehicleName: "2024 Tesla Model 3",
      powertrain: "electric",
      purchasePrice: 38000,
      downPayment: 5000,
      salesTaxRate: 7.5,
      loanTermMonths: 60,
      loanInterestRate: 5.5,
      ownershipYears: 5,
      annualMileage: 12000,
      fuelEconomyMPG: 0,
      fuelPricePerGal: 0,
      efficiencyKWhPer100Mi: 25,
      electricityRatePerKWh: 0.15,
      annualInsurance: 1500,
      annualMaintenance: 800,
      annualFees: 300,
      depreciationRate: 15.0,
    };

    const res = calculateTCO(input);
    expect(res.categories.financingInterest).toBeGreaterThan(0);
    // 12000 miles/yr * 0.25 kWh/mi = 3000 kWh/yr * $0.15 = $450/yr * 5 = $2250
    expect(res.categories.fuelOrEnergy).toBe(2250);
    expect(res.yearly[4].remainingLoanBalance).toBe(0);
  });
});
