export type PowertrainType = "gas" | "hybrid" | "electric";
export type AcquisitionType = "cash" | "loan" | "lease";

export interface LeaseInput {
  leaseTermMonths: number;
  dueAtSigning: number;
  monthlyPayment: number;
  moneyFactor: number;
  residualPercent: number;
  acquisitionFee: number;
  dispositionFee: number;
  annualMileageLimit: number;
  excessMileageFeeRate: number;
  buyoutAtEnd: boolean;
}

export interface TCOInput {
  vehicleName: string;
  powertrain: PowertrainType;
  acquisition: AcquisitionType;
  purchasePrice: number;
  downPayment: number;
  salesTaxRate: number;
  loanTermMonths: number;
  loanInterestRate: number;
  lease?: LeaseInput;
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
  leasePayment?: number;
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
  acquisition: AcquisitionType;
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

export function calculateTCO(rawInput: TCOInput): TCOResult {
  const input = { ...rawInput };

  // Normalize defaults
  if (!input.acquisition) {
    if (input.loanTermMonths === 0 && input.downPayment >= input.purchasePrice && input.purchasePrice > 0) {
      input.acquisition = "cash";
    } else {
      input.acquisition = "loan";
    }
  }

  if (input.acquisition === "cash") {
    input.loanTermMonths = 0;
    input.loanInterestRate = 0;
    input.downPayment = input.purchasePrice;
  }

  if (input.acquisition === "lease" && input.lease) {
    if (input.lease.leaseTermMonths <= 0) {
      input.lease.leaseTermMonths = 36;
    }
    const leaseYears = Math.max(1, Math.ceil(input.lease.leaseTermMonths / 12));
    input.ownershipYears = leaseYears;
  }

  // Energy / fuel calculation
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

  if (input.acquisition === "lease" && input.lease) {
    return calculateLease(input, annualEnergyCost);
  }

  return calculatePurchaseOrLoan(input, annualEnergyCost);
}

function calculatePurchaseOrLoan(input: TCOInput, annualEnergyCost: number): TCOResult {
  const totalMonths = input.ownershipYears * 12;
  const salesTax = roundToCent(input.purchasePrice * (input.salesTaxRate / 100));

  let principal = input.purchasePrice - input.downPayment;
  if (input.acquisition === "cash" || input.loanTermMonths === 0) {
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
      if (input.acquisition === "cash" || input.loanTermMonths === 0) {
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
    acquisition: input.acquisition,
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

function calculateLease(input: TCOInput, annualEnergyCost: number): TCOResult {
  const lease = input.lease!;
  const totalYears = input.ownershipYears;
  const leaseMonths = lease.leaseTermMonths;

  let residualPercent = lease.residualPercent;
  if (!residualPercent || residualPercent <= 0) {
    residualPercent = 55.0;
  }
  const contractResidual = roundToCent(input.purchasePrice * (residualPercent / 100));

  let monthlyPayment = 0;
  let monthlyDepreciation = 0;
  let monthlyRentCharge = 0;

  if (lease.monthlyPayment > 0) {
    monthlyPayment = lease.monthlyPayment;
    const estTotalDepr = input.purchasePrice - contractResidual;
    if (estTotalDepr > 0 && leaseMonths > 0) {
      monthlyDepreciation = roundToCent(estTotalDepr / leaseMonths);
    }
    if (monthlyPayment > monthlyDepreciation) {
      monthlyRentCharge = roundToCent(monthlyPayment - monthlyDepreciation);
    }
  } else {
    // Dealership formula
    const grossCapCost = input.purchasePrice + (lease.acquisitionFee || 0);
    let netCapCost = grossCapCost - (lease.dueAtSigning || 0);
    if (netCapCost < contractResidual) {
      netCapCost = contractResidual;
    }
    monthlyDepreciation = roundToCent((netCapCost - contractResidual) / leaseMonths);
    monthlyRentCharge = roundToCent((netCapCost + contractResidual) * (lease.moneyFactor || 0));
    const basePayment = monthlyDepreciation + monthlyRentCharge;
    const taxOnPayment = basePayment * (input.salesTaxRate / 100);
    monthlyPayment = roundToCent(basePayment + taxOnPayment);
  }

  // Excess mileage penalty
  let excessMileageFee = 0;
  const totalContractMilesAllowed = (lease.annualMileageLimit || 12000) * (leaseMonths / 12);
  const actualTotalMiles = input.annualMileage * totalYears;
  if (!lease.buyoutAtEnd && lease.annualMileageLimit > 0 && actualTotalMiles > totalContractMilesAllowed && lease.excessMileageFeeRate > 0) {
    const excessMiles = actualTotalMiles - totalContractMilesAllowed;
    excessMileageFee = roundToCent(excessMiles * lease.excessMileageFeeRate);
  }

  const yearly: YearlyBreakdown[] = [];
  let cumulativeDepreciation = 0;
  let cumulativeRentCharges = 0;
  let cumulativeEnergy = 0;
  let cumulativeInsurance = 0;
  let cumulativeMaintenance = 0;
  let cumulativeFees = 0;

  for (let y = 0; y < totalYears; y++) {
    const yearNumber = y + 1;
    const monthStart = y * 12;
    let monthEnd = (y + 1) * 12;
    if (monthEnd > leaseMonths) {
      monthEnd = leaseMonths;
    }
    const monthsInYear = Math.max(0, monthEnd - monthStart);

    const yearLeasePayment = roundToCent(monthlyPayment * monthsInYear);
    const yearDepreciation = roundToCent(monthlyDepreciation * monthsInYear);
    const yearRentCharge = roundToCent(monthlyRentCharge * monthsInYear);

    cumulativeDepreciation += yearDepreciation;
    cumulativeRentCharges += yearRentCharge;

    const yearEnergy = annualEnergyCost;
    const yearInsurance = input.annualInsurance;
    const yearMaintenance = input.annualMaintenance;
    const yearFees = input.annualFees;

    cumulativeEnergy += yearEnergy;
    cumulativeInsurance += yearInsurance;
    cumulativeMaintenance += yearMaintenance;
    cumulativeFees += yearFees;

    let yearOutflow = yearLeasePayment + yearEnergy + yearInsurance + yearMaintenance + yearFees;

    if (y === 0) {
      yearOutflow += (lease.dueAtSigning || 0) + (lease.acquisitionFee || 0);
    }

    let endingVehicleValue = 0;
    if (y === totalYears - 1) {
      if (lease.buyoutAtEnd) {
        const buyoutSalesTax = roundToCent(contractResidual * (input.salesTaxRate / 100));
        yearOutflow += contractResidual + buyoutSalesTax;
        endingVehicleValue = contractResidual;
      } else {
        yearOutflow += (lease.dispositionFee || 0) + excessMileageFee;
        endingVehicleValue = 0;
      }
    }

    yearly.push({
      year: yearNumber,
      depreciationCost: yearDepreciation,
      loanPayment: yearLeasePayment,
      loanInterest: yearRentCharge,
      leasePayment: yearLeasePayment,
      fuelOrEnergyCost: yearEnergy,
      insuranceCost: yearInsurance,
      maintenanceCost: yearMaintenance,
      feesCost: yearFees,
      totalOutflow: roundToCent(yearOutflow),
      endingVehicleValue,
      remainingLoanBalance: 0,
    });
  }

  let totalOutflow = 0;
  for (const yr of yearly) {
    totalOutflow += yr.totalOutflow;
  }
  totalOutflow = roundToCent(totalOutflow);

  const residualValue = lease.buyoutAtEnd ? contractResidual : 0;
  const netCost = roundToCent(totalOutflow - residualValue);
  const monthlyAvg = roundToCent(netCost / (totalYears * 12));
  const costPerMile = actualTotalMiles > 0 ? Math.round((netCost / actualTotalMiles) * 1000) / 1000 : 0;

  let leaseTaxesAndFees = roundToCent(cumulativeFees + (lease.dueAtSigning || 0) + (lease.acquisitionFee || 0));
  if (!lease.buyoutAtEnd) {
    leaseTaxesAndFees += roundToCent((lease.dispositionFee || 0) + excessMileageFee);
  }

  return {
    input,
    acquisition: "lease",
    totalCostOfOwnership: totalOutflow,
    residualValue,
    netCostOfOwnership: netCost,
    monthlyAverageCost: monthlyAvg,
    costPerMile,
    categories: {
      depreciation: roundToCent(cumulativeDepreciation),
      financingInterest: roundToCent(cumulativeRentCharges),
      fuelOrEnergy: roundToCent(cumulativeEnergy),
      insurance: roundToCent(cumulativeInsurance),
      maintenance: roundToCent(cumulativeMaintenance),
      taxesAndFees: roundToCent(leaseTaxesAndFees),
    },
    yearly,
  };
}
