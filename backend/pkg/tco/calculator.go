package tco

import (
	"math"
	"strings"
)

// Calculate computes the full Total Cost of Ownership based on the provided input.
func Calculate(in TCOInput) (*TCOResult, error) {
	if err := in.Validate(); err != nil {
		return nil, err
	}

	// Annual energy / fuel expense calculation (shared across all acquisition modes)
	var annualEnergyCost float64
	normPowertrain := PowertrainType(strings.ToLower(string(in.Powertrain)))
	switch normPowertrain {
	case PowertrainGas, PowertrainHybrid:
		if in.FuelEconomyMPG > 0 {
			gallonsPerYear := in.AnnualMileage / in.FuelEconomyMPG
			annualEnergyCost = gallonsPerYear * in.FuelPricePerGal
		}
	case PowertrainElectric:
		if in.EfficiencyKWhPer100Mi > 0 {
			kwhPerYear := (in.AnnualMileage / 100.0) * in.EfficiencyKWhPer100Mi
			annualEnergyCost = kwhPerYear * in.ElectricityRatePerKWh
		}
	}
	annualEnergyCost = roundToCent(annualEnergyCost)

	if in.Acquisition == AcquisitionLease {
		return calculateLease(in, annualEnergyCost)
	}

	return calculatePurchaseOrLoan(in, annualEnergyCost)
}

func calculatePurchaseOrLoan(in TCOInput, annualEnergyCost float64) (*TCOResult, error) {
	totalMonths := in.OwnershipYears * 12
	salesTax := roundToCent(in.PurchasePrice * (in.SalesTaxRate / 100.0))

	principal := in.PurchasePrice - in.DownPayment
	if in.Acquisition == AcquisitionCash || in.LoanTermMonths == 0 {
		principal = 0 // Cash purchase
	}

	// Monthly loan payment calculation
	var monthlyPayment float64
	var monthlyRate float64
	if principal > 0 && in.LoanTermMonths > 0 {
		monthlyRate = (in.LoanInterestRate / 100.0) / 12.0
		if monthlyRate > 0 {
			comp := math.Pow(1.0+monthlyRate, float64(in.LoanTermMonths))
			monthlyPayment = principal * (monthlyRate * comp) / (comp - 1.0)
		} else {
			monthlyPayment = principal / float64(in.LoanTermMonths)
		}
	}

	// Year-by-year progression simulation
	yearly := make([]YearlyBreakdown, in.OwnershipYears)
	currentValue := in.PurchasePrice
	deprRate := in.DepreciationRate / 100.0
	loanBalance := principal

	var cumulativeDepreciation float64
	var cumulativeInterest float64
	var cumulativeLoanPayments float64
	var cumulativeEnergy float64
	var cumulativeInsurance float64
	var cumulativeMaintenance float64
	var cumulativeFees float64

	monthCounter := 0
	for y := 0; y < in.OwnershipYears; y++ {
		yearNumber := y + 1

		// Depreciation for this year
		startValue := currentValue
		endValue := startValue * (1.0 - deprRate)
		yearDepreciation := roundToCent(startValue - endValue)
		currentValue = roundToCent(endValue)
		cumulativeDepreciation += yearDepreciation

		// Loan amortization for this year (12 months)
		var yearLoanPayment float64
		var yearLoanInterest float64
		for m := 0; m < 12; m++ {
			monthCounter++
			if monthCounter <= in.LoanTermMonths && loanBalance > 0 {
				interest := loanBalance * monthlyRate
				principalPaid := monthlyPayment - interest
				if principalPaid > loanBalance {
					principalPaid = loanBalance
					monthlyPayment = principalPaid + interest
				}
				loanBalance -= principalPaid
				if loanBalance < 0.001 {
					loanBalance = 0
				}
				yearLoanPayment += monthlyPayment
				yearLoanInterest += interest
			}
		}

		yearLoanPayment = roundToCent(yearLoanPayment)
		yearLoanInterest = roundToCent(yearLoanInterest)
		cumulativeLoanPayments += yearLoanPayment
		cumulativeInterest += yearLoanInterest

		// Operating costs for this year
		yearEnergy := annualEnergyCost
		yearInsurance := in.AnnualInsurance
		yearMaintenance := in.AnnualMaintenance
		yearFees := in.AnnualFees

		cumulativeEnergy += yearEnergy
		cumulativeInsurance += yearInsurance
		cumulativeMaintenance += yearMaintenance
		cumulativeFees += yearFees

		yearOutflow := yearLoanPayment + yearEnergy + yearInsurance + yearMaintenance + yearFees
		if y == 0 {
			if in.Acquisition == AcquisitionCash || in.LoanTermMonths == 0 {
				yearOutflow += in.PurchasePrice + salesTax
			} else {
				yearOutflow += in.DownPayment + salesTax
			}
		}

		yearly[y] = YearlyBreakdown{
			Year:                 yearNumber,
			DepreciationCost:     yearDepreciation,
			LoanPayment:          yearLoanPayment,
			LoanInterest:         yearLoanInterest,
			FuelOrEnergyCost:     yearEnergy,
			InsuranceCost:        yearInsurance,
			MaintenanceCost:      yearMaintenance,
			FeesCost:             yearFees,
			TotalOutflow:         roundToCent(yearOutflow),
			EndingVehicleValue:   currentValue,
			RemainingLoanBalance: roundToCent(loanBalance),
		}
	}

	// Calculate summary metrics
	residualValue := currentValue
	totalOutflow := 0.0
	for _, y := range yearly {
		totalOutflow += y.TotalOutflow
	}
	totalOutflow = roundToCent(totalOutflow)

	// Net Cost = Total cash outflow + remaining loan debt - vehicle liquidation value
	netCost := roundToCent(totalOutflow + roundToCent(loanBalance) - residualValue)

	totalMonthsFloat := float64(totalMonths)
	monthlyAvg := roundToCent(netCost / totalMonthsFloat)

	totalMiles := in.AnnualMileage * float64(in.OwnershipYears)
	var costPerMile float64
	if totalMiles > 0 {
		costPerMile = math.Round((netCost/totalMiles)*1000) / 1000 // 3 decimal places for $/mile
	}

	categories := CostCategoryBreakdown{
		Depreciation:      roundToCent(cumulativeDepreciation),
		FinancingInterest: roundToCent(cumulativeInterest),
		FuelOrEnergy:      roundToCent(cumulativeEnergy),
		Insurance:         roundToCent(cumulativeInsurance),
		Maintenance:       roundToCent(cumulativeMaintenance),
		TaxesAndFees:      roundToCent(salesTax + cumulativeFees),
	}

	return &TCOResult{
		Input:                in,
		Acquisition:          in.Acquisition,
		TotalCostOfOwnership: totalOutflow,
		ResidualValue:        residualValue,
		NetCostOfOwnership:   netCost,
		MonthlyAverageCost:   monthlyAvg,
		CostPerMile:          costPerMile,
		Categories:           categories,
		Yearly:               yearly,
	}, nil
}

func calculateLease(in TCOInput, annualEnergyCost float64) (*TCOResult, error) {
	lease := in.Lease
	totalYears := in.OwnershipYears
	leaseMonths := lease.LeaseTermMonths

	// Determine contract residual value
	residualPercent := lease.ResidualPercent
	if residualPercent <= 0 {
		residualPercent = 55.0
	}
	contractResidual := roundToCent(in.PurchasePrice * (residualPercent / 100.0))

	// Determine monthly lease payment, monthly depreciation, and monthly rent charge
	var monthlyPayment float64
	var monthlyDepreciation float64
	var monthlyRentCharge float64

	if lease.MonthlyPayment > 0 {
		monthlyPayment = lease.MonthlyPayment
		// Approximate depreciation and rent components for breakdown
		estTotalDepr := in.PurchasePrice - contractResidual
		if estTotalDepr > 0 && leaseMonths > 0 {
			monthlyDepreciation = roundToCent(estTotalDepr / float64(leaseMonths))
		}
		if monthlyPayment > monthlyDepreciation {
			monthlyRentCharge = roundToCent(monthlyPayment - monthlyDepreciation)
		}
	} else {
		// Dealership lease formula
		grossCapCost := in.PurchasePrice + lease.AcquisitionFee
		netCapCost := grossCapCost - lease.DueAtSigning
		if netCapCost < contractResidual {
			netCapCost = contractResidual
		}
		monthlyDepreciation = roundToCent((netCapCost - contractResidual) / float64(leaseMonths))
		monthlyRentCharge = roundToCent((netCapCost + contractResidual) * lease.MoneyFactor)
		basePayment := monthlyDepreciation + monthlyRentCharge
		taxOnPayment := basePayment * (in.SalesTaxRate / 100.0)
		monthlyPayment = roundToCent(basePayment + taxOnPayment)
	}

	// Calculate excess mileage fee (only if returned without buyout)
	var excessMileageFee float64
	totalContractMilesAllowed := lease.AnnualMileageLimit * (float64(leaseMonths) / 12.0)
	actualTotalMiles := in.AnnualMileage * float64(totalYears)
	if !lease.BuyoutAtEnd && lease.AnnualMileageLimit > 0 && actualTotalMiles > totalContractMilesAllowed && lease.ExcessMileageFeeRate > 0 {
		excessMiles := actualTotalMiles - totalContractMilesAllowed
		excessMileageFee = roundToCent(excessMiles * lease.ExcessMileageFeeRate)
	}

	yearly := make([]YearlyBreakdown, totalYears)
	var cumulativeLeasePayments float64
	var cumulativeDepreciation float64
	var cumulativeRentCharges float64
	var cumulativeEnergy float64
	var cumulativeInsurance float64
	var cumulativeMaintenance float64
	var cumulativeFees float64

	for y := 0; y < totalYears; y++ {
		yearNumber := y + 1

		monthStart := y * 12
		monthEnd := (y + 1) * 12
		if monthEnd > leaseMonths {
			monthEnd = leaseMonths
		}
		monthsInYear := monthEnd - monthStart
		if monthsInYear < 0 {
			monthsInYear = 0
		}

		yearLeasePayment := roundToCent(monthlyPayment * float64(monthsInYear))
		yearDepreciation := roundToCent(monthlyDepreciation * float64(monthsInYear))
		yearRentCharge := roundToCent(monthlyRentCharge * float64(monthsInYear))

		cumulativeLeasePayments += yearLeasePayment
		cumulativeDepreciation += yearDepreciation
		cumulativeRentCharges += yearRentCharge

		yearEnergy := annualEnergyCost
		yearInsurance := in.AnnualInsurance
		yearMaintenance := in.AnnualMaintenance
		yearFees := in.AnnualFees

		cumulativeEnergy += yearEnergy
		cumulativeInsurance += yearInsurance
		cumulativeMaintenance += yearMaintenance
		cumulativeFees += yearFees

		yearOutflow := yearLeasePayment + yearEnergy + yearInsurance + yearMaintenance + yearFees

		if y == 0 {
			// Upfront cash at lease signing
			yearOutflow += lease.DueAtSigning + lease.AcquisitionFee
		}

		var endingVehicleValue float64
		if y == totalYears-1 {
			if lease.BuyoutAtEnd {
				// Lessee exercises purchase buyout option
				buyoutSalesTax := roundToCent(contractResidual * (in.SalesTaxRate / 100.0))
				yearOutflow += contractResidual + buyoutSalesTax
				endingVehicleValue = contractResidual
			} else {
				// Vehicle surrendered to dealership
				yearOutflow += lease.DispositionFee + excessMileageFee
				endingVehicleValue = 0.0
			}
		}

		yearly[y] = YearlyBreakdown{
			Year:                 yearNumber,
			DepreciationCost:     yearDepreciation,
			LoanPayment:          yearLeasePayment,
			LoanInterest:         yearRentCharge,
			LeasePayment:         yearLeasePayment,
			FuelOrEnergyCost:     yearEnergy,
			InsuranceCost:        yearInsurance,
			MaintenanceCost:      yearMaintenance,
			FeesCost:             yearFees,
			TotalOutflow:         roundToCent(yearOutflow),
			EndingVehicleValue:   endingVehicleValue,
			RemainingLoanBalance: 0.0,
		}
	}

	totalOutflow := 0.0
	for _, y := range yearly {
		totalOutflow += y.TotalOutflow
	}
	totalOutflow = roundToCent(totalOutflow)

	var residualValue float64
	if lease.BuyoutAtEnd {
		residualValue = contractResidual
	} else {
		residualValue = 0.0
	}

	netCost := roundToCent(totalOutflow - residualValue)
	monthlyAvg := roundToCent(netCost / float64(totalYears*12))

	var costPerMile float64
	if actualTotalMiles > 0 {
		costPerMile = math.Round((netCost/actualTotalMiles)*1000) / 1000
	}

	leaseTaxesAndFees := roundToCent(cumulativeFees + lease.DueAtSigning + lease.AcquisitionFee)
	if !lease.BuyoutAtEnd {
		leaseTaxesAndFees += roundToCent(lease.DispositionFee + excessMileageFee)
	}

	categories := CostCategoryBreakdown{
		Depreciation:      roundToCent(cumulativeDepreciation),
		FinancingInterest: roundToCent(cumulativeRentCharges),
		FuelOrEnergy:      roundToCent(cumulativeEnergy),
		Insurance:         roundToCent(cumulativeInsurance),
		Maintenance:       roundToCent(cumulativeMaintenance),
		TaxesAndFees:      roundToCent(leaseTaxesAndFees),
	}

	return &TCOResult{
		Input:                in,
		Acquisition:          AcquisitionLease,
		TotalCostOfOwnership: totalOutflow,
		ResidualValue:        residualValue,
		NetCostOfOwnership:   netCost,
		MonthlyAverageCost:   monthlyAvg,
		CostPerMile:          costPerMile,
		Categories:           categories,
		Yearly:               yearly,
	}, nil
}

func roundToCent(val float64) float64 {
	return math.Round(val*100.0) / 100.0
}
