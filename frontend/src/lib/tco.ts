export type PowertrainType = "gas" | "hybrid" | "electric";

export interface TCOInput {
  vehicleName: string;
  powertrain: PowertrainType;
  purchasePrice: number;
  downPayment: number;
  salesTaxRate: number;
  loanTermMonths: number;
  loanInterestRate: number;
  ownershipYears: number;
  annualMileage: number;
  fuelEconomyMPG: number;
  fuelPricePerGal: number;
  efficiencyKWhPer100Mi: number;
  electricityRatePerKWh: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualFees: number;
  depreciationRate: number;
}

export interface CostCategoryBreakdown {
  depreciation: number;
  financingInterest: number;
  fuelOrEnergy: number;
  insurance: number;
  maintenance: number;
  taxesAndFees: number;
}

export interface YearlyBreakdown {
  year: number;
  depreciationCost: number;
  loanPayment: number;
  loanInterest: number;
  fuelOrEnergyCost: number;
  insuranceCost: number;
  maintenanceCost: number;
  feesCost: number;
  totalOutflow: number;
  endingVehicleValue: number;
  remainingLoanBalance: number;
}

export interface TCOResult {
  input: TCOInput;
  totalCostOfOwnership: number;
  residualValue: number;
  netCostOfOwnership: number;
  monthlyAverageCost: number;
  costPerMile: number;
  categories: CostCategoryBreakdown;
  yearly: YearlyBreakdown[];
}

export function roundToCent(val: number): number {
  return Math.round(val * 100) / 100;
}

export function calculateTCO(input: TCOInput): TCOResult {
  const totalMonths = input.ownershipYears * 12;
  const salesTax = roundToCent(input.purchasePrice * (input.salesTaxRate / 100));

  let principal = input.purchasePrice - input.downPayment;
  if (input.loanTermMonths === 0) {
    principal = 0;
  }

  let monthlyPayment = 0;
  let monthlyRate = 0;
  if (principal > 0 && input.loanTermMonths > 0) {
    monthlyRate = input.loanInterestRate / 100 / 12;
    if (monthlyRate > 0) {
      const comp = Math.pow(1 + monthlyRate, input.loanTermMonths);
      monthlyPayment = (principal * (monthlyRate * comp)) / (comp - 1);
    } else {
      monthlyPayment = principal / input.loanTermMonths;
    }
  }

  let annualEnergyCost = 0;
  if (input.powertrain === "electric") {
    if (input.efficiencyKWhPer100Mi > 0) {
      const kwhPerYear = (input.annualMileage / 100) * input.efficiencyKWhPer100Mi;
      annualEnergyCost = kwhPerYear * input.electricityRatePerKWh;
    }
  } else {
    if (input.fuelEconomyMPG > 0) {
      const gallonsPerYear = input.annualMileage / input.fuelEconomyMPG;
      annualEnergyCost = gallonsPerYear * input.fuelPricePerGal;
    }
  }
  annualEnergyCost = roundToCent(annualEnergyCost);

  const yearly: YearlyBreakdown[] = [];
  let currentValue = input.purchasePrice;
  const deprRate = input.depreciationRate / 100;
  let loanBalance = principal;

  let cumulativeDepr = 0;
  let cumulativeInterest = 0;
  let cumulativeEnergy = 0;
  let cumulativeInsurance = 0;
  let cumulativeMaintenance = 0;
  let cumulativeFees = 0;

  let monthCounter = 0;
  for (let y = 0; y < input.ownershipYears; y++) {
    const startValue = currentValue;
    const endValue = startValue * (1 - deprRate);
    const yearDepr = roundToCent(startValue - endValue);
    currentValue = roundToCent(endValue);
    cumulativeDepr += yearDepr;

    let yearLoanPayment = 0;
    let yearLoanInterest = 0;

    for (let m = 0; m < 12; m++) {
      monthCounter++;
      if (monthCounter <= input.loanTermMonths && loanBalance > 0) {
        const interest = loanBalance * monthlyRate;
        let principalPaid = monthlyPayment - interest;
        if (principalPaid > loanBalance) {
          principalPaid = loanBalance;
        }
        loanBalance -= principalPaid;
        if (loanBalance < 0.001) {
          loanBalance = 0;
        }
        yearLoanPayment += monthlyPayment;
        yearLoanInterest += interest;
      }
    }

    yearLoanPayment = roundToCent(yearLoanPayment);
    yearLoanInterest = roundToCent(yearLoanInterest);
    cumulativeInterest += yearLoanInterest;

    const yearEnergy = annualEnergyCost;
    const yearInsurance = input.annualInsurance;
    const yearMaintenance = input.annualMaintenance;
    const yearFees = input.annualFees;

    cumulativeEnergy += yearEnergy;
    cumulativeInsurance += yearInsurance;
    cumulativeMaintenance += yearMaintenance;
    cumulativeFees += yearFees;

    let yearOutflow = yearLoanPayment + yearEnergy + yearInsurance + yearMaintenance + yearFees;
    if (y === 0) {
      if (input.loanTermMonths === 0) {
        yearOutflow += input.purchasePrice + salesTax;
      } else {
        yearOutflow += input.downPayment + salesTax;
      }
    }

    yearly.push({
      year: y + 1,
      depreciationCost: yearDepr,
      loanPayment: yearLoanPayment,
      loanInterest: yearLoanInterest,
      fuelOrEnergyCost: yearEnergy,
      insuranceCost: yearInsurance,
      maintenanceCost: yearMaintenance,
      feesCost: yearFees,
      totalOutflow: roundToCent(yearOutflow),
      endingVehicleValue: currentValue,
      remainingLoanBalance: roundToCent(loanBalance),
    });
  }

  const residualValue = currentValue;
  let totalOutflow = 0;
  for (const yr of yearly) {
    totalOutflow += yr.totalOutflow;
  }
  totalOutflow = roundToCent(totalOutflow);

  const netCost = roundToCent(totalOutflow + roundToCent(loanBalance) - residualValue);
  const monthlyAvg = roundToCent(netCost / totalMonths);
  const totalMiles = input.annualMileage * input.ownershipYears;
  const costPerMile = totalMiles > 0 ? Math.round((netCost / totalMiles) * 1000) / 1000 : 0;

  return {
    input,
    totalCostOfOwnership: totalOutflow,
    residualValue,
    netCostOfOwnership: netCost,
    monthlyAverageCost: monthlyAvg,
    costPerMile,
    categories: {
      depreciation: roundToCent(cumulativeDepr),
      financingInterest: roundToCent(cumulativeInterest),
      fuelOrEnergy: roundToCent(cumulativeEnergy),
      insurance: roundToCent(cumulativeInsurance),
      maintenance: roundToCent(cumulativeMaintenance),
      taxesAndFees: roundToCent(salesTax + cumulativeFees),
    },
    yearly,
  };
}
