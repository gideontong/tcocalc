package tco

import (
	"math"
	"testing"
)

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		input   TCOInput
		wantErr bool
	}{
		{
			name: "valid gas vehicle with loan",
			input: TCOInput{
				VehicleName:     "2024 Honda Civic",
				Powertrain:      PowertrainGas,
				Acquisition:     AcquisitionLoan,
				PurchasePrice:   28000,
				DownPayment:     5000,
				SalesTaxRate:    7.0,
				LoanTermMonths:  60,
				OwnershipYears:  5,
				AnnualMileage:   12000,
				FuelEconomyMPG:  32,
				FuelPricePerGal: 3.50,
			},
			wantErr: false,
		},
		{
			name: "valid cash purchase",
			input: TCOInput{
				VehicleName:     "2024 Mazda 3",
				Powertrain:      PowertrainGas,
				Acquisition:     AcquisitionCash,
				PurchasePrice:   26000,
				OwnershipYears:  5,
				AnnualMileage:   10000,
				FuelEconomyMPG:  30,
				FuelPricePerGal: 3.50,
			},
			wantErr: false,
		},
		{
			name: "valid lease with direct monthly payment",
			input: TCOInput{
				VehicleName:     "2024 BMW 330i",
				Powertrain:      PowertrainGas,
				Acquisition:     AcquisitionLease,
				PurchasePrice:   45000,
				AnnualMileage:   10000,
				FuelEconomyMPG:  28,
				FuelPricePerGal: 4.00,
				Lease: &LeaseInput{
					LeaseTermMonths: 36,
					DueAtSigning:    3000,
					MonthlyPayment:  550,
				},
			},
			wantErr: false,
		},
		{
			name: "valid lease with money factor formula",
			input: TCOInput{
				VehicleName:           "2024 Tesla Model Y",
				Powertrain:            PowertrainElectric,
				Acquisition:           AcquisitionLease,
				PurchasePrice:         48000,
				AnnualMileage:         12000,
				EfficiencyKWhPer100Mi: 28,
				ElectricityRatePerKWh: 0.16,
				Lease: &LeaseInput{
					LeaseTermMonths: 36,
					DueAtSigning:    4000,
					MoneyFactor:     0.0022,
					ResidualPercent: 57.0,
				},
			},
			wantErr: false,
		},
		{
			name: "invalid lease without lease details",
			input: TCOInput{
				VehicleName:   "2024 Car",
				Powertrain:    PowertrainGas,
				Acquisition:   AcquisitionLease,
				PurchasePrice: 30000,
			},
			wantErr: true,
		},
		{
			name: "invalid lease with zero term",
			input: TCOInput{
				VehicleName:   "2024 Car",
				Powertrain:    PowertrainGas,
				Acquisition:   AcquisitionLease,
				PurchasePrice: 30000,
				Lease: &LeaseInput{
					LeaseTermMonths: 0,
					MonthlyPayment:  400,
				},
			},
			wantErr: true,
		},
		{
			name: "zero purchase price",
			input: TCOInput{
				VehicleName:   "Free Car",
				Powertrain:    PowertrainGas,
				PurchasePrice: 0,
			},
			wantErr: true,
		},
		{
			name: "negative down payment on loan",
			input: TCOInput{
				VehicleName:   "Invalid Car",
				Powertrain:    PowertrainGas,
				Acquisition:   AcquisitionLoan,
				PurchasePrice: 20000,
				DownPayment:   -100,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.input.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr = %v", err, tt.wantErr)
			}
		})
	}
}

func TestCalculateCashPurchase(t *testing.T) {
	input := TCOInput{
		VehicleName:       "2024 Toyota Corolla",
		Powertrain:        PowertrainGas,
		Acquisition:       AcquisitionCash,
		PurchasePrice:     25000,
		SalesTaxRate:      8.0, // $2000
		OwnershipYears:    3,
		AnnualMileage:     10000,
		FuelEconomyMPG:    30,   // 333.33 gal/yr
		FuelPricePerGal:   3.00, // $1000/yr
		AnnualInsurance:   1200,
		AnnualMaintenance: 600,
		AnnualFees:        200,
		DepreciationRate:  10.0, // 10% per year
	}

	res, err := Calculate(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Categories.FinancingInterest != 0 {
		t.Errorf("expected 0 interest for cash purchase, got %f", res.Categories.FinancingInterest)
	}

	expectedSalesTax := 2000.0
	expectedFees := 3 * 200.0
	if math.Abs(res.Categories.TaxesAndFees-(expectedSalesTax+expectedFees)) > 1.0 {
		t.Errorf("taxes and fees mismatch: got %f, want %f", res.Categories.TaxesAndFees, expectedSalesTax+expectedFees)
	}

	if len(res.Yearly) != 3 {
		t.Fatalf("expected 3 yearly breakdowns, got %d", len(res.Yearly))
	}
	if res.ResidualValue <= 0 {
		t.Errorf("expected positive residual value for cash purchase, got %f", res.ResidualValue)
	}
}

func TestCalculateFinancedEV(t *testing.T) {
	input := TCOInput{
		VehicleName:           "2024 Tesla Model Y",
		Powertrain:            PowertrainElectric,
		Acquisition:           AcquisitionLoan,
		PurchasePrice:         44000,
		DownPayment:           4000,
		SalesTaxRate:          7.5,
		LoanTermMonths:        60,
		LoanInterestRate:      5.0,
		OwnershipYears:        5,
		AnnualMileage:         15000,
		EfficiencyKWhPer100Mi: 28,  // 4200 kWh/yr
		ElectricityRatePerKWh: 0.16, // $672/yr
		AnnualInsurance:       1600,
		AnnualMaintenance:     500,
		AnnualFees:            350,
		DepreciationRate:      15.0,
	}

	res, err := Calculate(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Categories.FinancingInterest <= 0 {
		t.Errorf("expected positive financing interest, got %f", res.Categories.FinancingInterest)
	}

	if len(res.Yearly) != 5 {
		t.Fatalf("expected 5 yearly breakdowns, got %d", len(res.Yearly))
	}
	if res.Yearly[4].RemainingLoanBalance != 0 {
		t.Errorf("expected loan balance 0 at end of 60 month loan, got %f", res.Yearly[4].RemainingLoanBalance)
	}
}

func TestCalculateLeaseStandardReturn(t *testing.T) {
	input := TCOInput{
		VehicleName:     "2024 BMW 330i",
		Powertrain:      PowertrainGas,
		Acquisition:     AcquisitionLease,
		PurchasePrice:   45000,
		SalesTaxRate:    8.0,
		AnnualMileage:   10000,
		FuelEconomyMPG:  28,
		FuelPricePerGal: 3.80,
		AnnualInsurance: 1500,
		AnnualMaintenance: 400,
		AnnualFees:      300,
		Lease: &LeaseInput{
			LeaseTermMonths:    36,
			DueAtSigning:       3000,
			MonthlyPayment:     500,
			AcquisitionFee:     795,
			DispositionFee:     450,
			AnnualMileageLimit: 10000,
			BuyoutAtEnd:        false,
		},
	}

	res, err := Calculate(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Lease should synchronize ownership years to 3 (36 months)
	if len(res.Yearly) != 3 {
		t.Fatalf("expected 3 yearly breakdowns for 36-month lease, got %d", len(res.Yearly))
	}

	// Standard return has $0 residual vehicle asset value for lessee
	if res.ResidualValue != 0 {
		t.Errorf("expected $0 residual value for lease return, got %f", res.ResidualValue)
	}

	// Net cost equals total outflow
	if math.Abs(res.NetCostOfOwnership-res.TotalCostOfOwnership) > 0.01 {
		t.Errorf("expected net cost equal to total outflow for lease return, got net=%f, total=%f",
			res.NetCostOfOwnership, res.TotalCostOfOwnership)
	}
}

func TestCalculateLeaseFormulaAndExcessMileage(t *testing.T) {
	input := TCOInput{
		VehicleName:     "2024 Lexus RX",
		Powertrain:      PowertrainHybrid,
		Acquisition:     AcquisitionLease,
		PurchasePrice:   50000,
		SalesTaxRate:    8.0,
		AnnualMileage:   15000, // 3000 miles over 12k/yr allowance -> 9000 excess over 3 years
		FuelEconomyMPG:  36,
		FuelPricePerGal: 3.80,
		AnnualInsurance: 1600,
		AnnualMaintenance: 500,
		AnnualFees:      350,
		Lease: &LeaseInput{
			LeaseTermMonths:      36,
			DueAtSigning:         4000,
			MoneyFactor:          0.0020, // ~4.8% APR
			ResidualPercent:      58.0,   // $29,000 residual
			AcquisitionFee:       895,
			DispositionFee:       395,
			AnnualMileageLimit:   12000, // 36k miles total allowed
			ExcessMileageFeeRate: 0.25,  // 9k excess * $0.25 = $2250 penalty
			BuyoutAtEnd:          false,
		},
	}

	res, err := Calculate(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Excess mileage: (15000 - 12000) * 3 = 9000 miles * $0.25 = $2250
	// Disposition fee: $395
	// Check that final year outflow includes the disposition fee and excess mileage
	if res.Categories.TaxesAndFees < 2645 { // 2250 + 395
		t.Errorf("expected excess mileage + disposition in fees, got %f", res.Categories.TaxesAndFees)
	}
}

func TestCalculateLeaseBuyout(t *testing.T) {
	input := TCOInput{
		VehicleName:     "2024 Honda Accord",
		Powertrain:      PowertrainGas,
		Acquisition:     AcquisitionLease,
		PurchasePrice:   32000,
		SalesTaxRate:    7.0,
		AnnualMileage:   12000,
		FuelEconomyMPG:  32,
		FuelPricePerGal: 3.50,
		Lease: &LeaseInput{
			LeaseTermMonths: 36,
			DueAtSigning:    2500,
			MonthlyPayment:  380,
			ResidualPercent: 55.0, // $17,600 residual
			BuyoutAtEnd:     true, // exercises buyout option!
		},
	}

	res, err := Calculate(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expectedResidual := 32000.0 * 0.55 // $17,600
	if math.Abs(res.ResidualValue-expectedResidual) > 1.0 {
		t.Errorf("expected residual asset value %f for buyout, got %f", expectedResidual, res.ResidualValue)
	}

	// Final year ending vehicle value should be the residual asset value
	if res.Yearly[2].EndingVehicleValue != expectedResidual {
		t.Errorf("expected year 3 ending value %f, got %f", expectedResidual, res.Yearly[2].EndingVehicleValue)
	}
}
