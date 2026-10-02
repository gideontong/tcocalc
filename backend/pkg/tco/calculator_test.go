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
			name: "valid gas vehicle",
			input: TCOInput{
				VehicleName:     "2024 Honda Civic",
				Powertrain:      PowertrainGas,
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
			name: "valid electric vehicle",
			input: TCOInput{
				VehicleName:           "2024 Tesla Model 3",
				Powertrain:            PowertrainElectric,
				PurchasePrice:         38000,
				OwnershipYears:        5,
				AnnualMileage:         12000,
				EfficiencyKWhPer100Mi: 25,
				ElectricityRatePerKWh: 0.15,
			},
			wantErr: false,
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
			name: "negative down payment",
			input: TCOInput{
				VehicleName:   "Invalid Car",
				Powertrain:    PowertrainGas,
				PurchasePrice: 20000,
				DownPayment:   -100,
			},
			wantErr: true,
		},
		{
			name: "down payment exceeds price",
			input: TCOInput{
				VehicleName:   "Invalid Car",
				Powertrain:    PowertrainGas,
				PurchasePrice: 20000,
				DownPayment:   25000,
			},
			wantErr: true,
		},
		{
			name: "missing fuel economy for gas",
			input: TCOInput{
				VehicleName:    "Gas Car",
				Powertrain:     PowertrainGas,
				PurchasePrice:  20000,
				OwnershipYears: 3,
				AnnualMileage:  10000,
				FuelEconomyMPG: 0,
			},
			wantErr: true,
		},
		{
			name: "missing efficiency for EV",
			input: TCOInput{
				VehicleName:           "EV Car",
				Powertrain:            PowertrainElectric,
				PurchasePrice:         35000,
				OwnershipYears:        3,
				AnnualMileage:         10000,
				EfficiencyKWhPer100Mi: 0,
			},
			wantErr: true,
		},
		{
			name: "unknown powertrain",
			input: TCOInput{
				VehicleName:    "Rocket Car",
				Powertrain:     "nuclear",
				PurchasePrice:  50000,
				OwnershipYears: 3,
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
		PurchasePrice:     25000,
		DownPayment:       25000,
		SalesTaxRate:      8.0, // $2000
		LoanTermMonths:    0,   // Cash purchase
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

	expectedFuel := 3 * 1000.0
	if math.Abs(res.Categories.FuelOrEnergy-expectedFuel) > 5.0 {
		t.Errorf("fuel mismatch: got %f, want %f", res.Categories.FuelOrEnergy, expectedFuel)
	}

	if len(res.Yearly) != 3 {
		t.Fatalf("expected 3 yearly breakdowns, got %d", len(res.Yearly))
	}

	if res.MonthlyAverageCost <= 0 {
		t.Errorf("expected positive monthly average cost, got %f", res.MonthlyAverageCost)
	}
	if res.CostPerMile <= 0 {
		t.Errorf("expected positive cost per mile, got %f", res.CostPerMile)
	}
}

func TestCalculateFinancedEV(t *testing.T) {
	input := TCOInput{
		VehicleName:           "2024 Tesla Model Y",
		Powertrain:            PowertrainElectric,
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

	expectedAnnualEnergy := (15000.0 / 100.0) * 28.0 * 0.16 // $672
	expectedTotalEnergy := expectedAnnualEnergy * 5          // $3360
	if math.Abs(res.Categories.FuelOrEnergy-expectedTotalEnergy) > 5.0 {
		t.Errorf("energy cost mismatch: got %f, want %f", res.Categories.FuelOrEnergy, expectedTotalEnergy)
	}

	// Verify residual value calculation after 5 years at 15% depreciation
	expectedResidual := 44000.0 * math.Pow(0.85, 5)
	if math.Abs(res.ResidualValue-expectedResidual) > 10.0 {
		t.Errorf("residual value mismatch: got %f, want ~%f", res.ResidualValue, expectedResidual)
	}

	// Verify all 5 years exist and final year loan balance is 0
	if len(res.Yearly) != 5 {
		t.Fatalf("expected 5 yearly breakdowns, got %d", len(res.Yearly))
	}
	if res.Yearly[4].RemainingLoanBalance != 0 {
		t.Errorf("expected loan balance 0 at end of 60 month loan, got %f", res.Yearly[4].RemainingLoanBalance)
	}
}
