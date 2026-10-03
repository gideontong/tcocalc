import { describe, it, expect } from "vitest";
import { calculateTCO, TCOInput } from "./tco";

describe("TCO Calculation Engine", () => {
  it("calculates cash purchase accurately", () => {
    const input: TCOInput = {
      vehicleName: "2024 Honda Civic",
      powertrain: "gas",
      acquisition: "cash",
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
    expect(res.acquisition).toBe("cash");
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
      acquisition: "loan",
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
    expect(res.acquisition).toBe("loan");
    expect(res.categories.financingInterest).toBeGreaterThan(0);
    // 12000 miles/yr * 0.25 kWh/mi = 3000 kWh/yr * $0.15 = $450/yr * 5 = $2250
    expect(res.categories.fuelOrEnergy).toBe(2250);
    expect(res.yearly[4].remainingLoanBalance).toBe(0);
  });

  it("calculates lease standard return with $0 residual value", () => {
    const input: TCOInput = {
      vehicleName: "2024 BMW 330i",
      powertrain: "gas",
      acquisition: "lease",
      purchasePrice: 45000,
      downPayment: 0,
      salesTaxRate: 8.0,
      loanTermMonths: 0,
      loanInterestRate: 0,
      ownershipYears: 3,
      annualMileage: 10000,
      fuelEconomyMPG: 28,
      fuelPricePerGal: 3.80,
      efficiencyKWhPer100Mi: 0,
      electricityRatePerKWh: 0,
      annualInsurance: 1500,
      annualMaintenance: 400,
      annualFees: 300,
      depreciationRate: 15.0,
      lease: {
        leaseTermMonths: 36,
        dueAtSigning: 3000,
        monthlyPayment: 500,
        moneyFactor: 0.002,
        residualPercent: 55,
        acquisitionFee: 795,
        dispositionFee: 450,
        annualMileageLimit: 10000,
        excessMileageFeeRate: 0.25,
        buyoutAtEnd: false,
      },
    };

    const res = calculateTCO(input);
    expect(res.acquisition).toBe("lease");
    expect(res.yearly.length).toBe(3);
    expect(res.residualValue).toBe(0);
    expect(res.netCostOfOwnership).toBe(res.totalCostOfOwnership);
  });

  it("calculates lease buyout retaining residual value", () => {
    const input: TCOInput = {
      vehicleName: "2024 Honda Accord",
      powertrain: "gas",
      acquisition: "lease",
      purchasePrice: 32000,
      downPayment: 0,
      salesTaxRate: 7.0,
      loanTermMonths: 0,
      loanInterestRate: 0,
      ownershipYears: 3,
      annualMileage: 12000,
      fuelEconomyMPG: 32,
      fuelPricePerGal: 3.50,
      efficiencyKWhPer100Mi: 0,
      electricityRatePerKWh: 0,
      annualInsurance: 1200,
      annualMaintenance: 600,
      annualFees: 250,
      depreciationRate: 15.0,
      lease: {
        leaseTermMonths: 36,
        dueAtSigning: 2500,
        monthlyPayment: 380,
        moneyFactor: 0.002,
        residualPercent: 55.0,
        acquisitionFee: 695,
        dispositionFee: 395,
        annualMileageLimit: 12000,
        excessMileageFeeRate: 0.25,
        buyoutAtEnd: true,
      },
    };

    const res = calculateTCO(input);
    const expectedResidual = 32000 * 0.55;
    expect(res.residualValue).toBe(expectedResidual);
    expect(res.yearly[2].endingVehicleValue).toBe(expectedResidual);
  });
});
