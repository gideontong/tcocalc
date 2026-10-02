package tco

import (
	"errors"
	"fmt"
	"strings"
)

// PowertrainType defines the vehicle powertrain category.
type PowertrainType string

const (
	PowertrainGas      PowertrainType = "gas"
	PowertrainHybrid   PowertrainType = "hybrid"
	PowertrainElectric PowertrainType = "electric"
)

// TCOInput encapsulates the input parameters needed to calculate total cost of ownership.
type TCOInput struct {
	VehicleName           string         `json:"vehicleName"`
	Powertrain            PowertrainType `json:"powertrain"`
	PurchasePrice         float64        `json:"purchasePrice"`
	DownPayment           float64        `json:"downPayment"`
	SalesTaxRate          float64        `json:"salesTaxRate"`          // Percentage, e.g., 7.5 for 7.5%
	LoanTermMonths        int            `json:"loanTermMonths"`        // 0 if cash purchase
	LoanInterestRate      float64        `json:"loanInterestRate"`      // Annual APR percentage, e.g. 5.5 for 5.5%
	OwnershipYears        int            `json:"ownershipYears"`        // Duration in years (e.g. 5)
	AnnualMileage         float64        `json:"annualMileage"`         // Miles driven per year
	FuelEconomyMPG        float64        `json:"fuelEconomyMPG"`        // Applicable for gas / hybrid
	FuelPricePerGal       float64        `json:"fuelPricePerGal"`       // Applicable for gas / hybrid ($/gal)
	EfficiencyKWhPer100Mi float64        `json:"efficiencyKWhPer100Mi"` // Applicable for electric (kWh per 100 miles)
	ElectricityRatePerKWh float64        `json:"electricityRatePerKWh"` // Applicable for electric ($/kWh)
	AnnualInsurance       float64        `json:"annualInsurance"`       // Estimated annual insurance cost
	AnnualMaintenance     float64        `json:"annualMaintenance"`     // Estimated annual maintenance & tires
	AnnualFees            float64        `json:"annualFees"`            // Annual registration, inspections, and taxes
	DepreciationRate      float64        `json:"depreciationRate"`      // Annual value loss percentage, e.g. 15.0 for 15%
}

// Validate checks for logical consistency and invalid ranges in the input.
func (in *TCOInput) Validate() error {
	if in.PurchasePrice <= 0 {
		return errors.New("purchasePrice must be greater than zero")
	}
	if in.DownPayment < 0 || in.DownPayment > in.PurchasePrice {
		return errors.New("downPayment cannot be negative or greater than purchasePrice")
	}
	if in.OwnershipYears <= 0 {
		return errors.New("ownershipYears must be at least 1")
	}
	if in.AnnualMileage < 0 {
		return errors.New("annualMileage cannot be negative")
	}
	if in.LoanTermMonths < 0 {
		return errors.New("loanTermMonths cannot be negative")
	}
	if in.SalesTaxRate < 0 || in.LoanInterestRate < 0 || in.DepreciationRate < 0 {
		return errors.New("rates cannot be negative")
	}

	normPowertrain := PowertrainType(strings.ToLower(string(in.Powertrain)))
	switch normPowertrain {
	case PowertrainGas, PowertrainHybrid:
		if in.AnnualMileage > 0 && in.FuelEconomyMPG <= 0 {
			return errors.New("fuelEconomyMPG must be greater than zero for gas/hybrid vehicles")
		}
	case PowertrainElectric:
		if in.AnnualMileage > 0 && in.EfficiencyKWhPer100Mi <= 0 {
			return errors.New("efficiencyKWhPer100Mi must be greater than zero for electric vehicles")
		}
	default:
		return fmt.Errorf("unsupported powertrain: %q (expected gas, hybrid, or electric)", in.Powertrain)
	}

	return nil
}

// CostCategoryBreakdown summarizes total expenses categorized by cost driver.
type CostCategoryBreakdown struct {
	Depreciation      float64 `json:"depreciation"`
	FinancingInterest float64 `json:"financingInterest"`
	FuelOrEnergy      float64 `json:"fuelOrEnergy"`
	Insurance         float64 `json:"insurance"`
	Maintenance       float64 `json:"maintenance"`
	TaxesAndFees      float64 `json:"taxesAndFees"`
}

// YearlyBreakdown captures the annual financial progression of vehicle ownership.
type YearlyBreakdown struct {
	Year                 int     `json:"year"`
	DepreciationCost     float64 `json:"depreciationCost"`
	LoanPayment          float64 `json:"loanPayment"`
	LoanInterest         float64 `json:"loanInterest"`
	FuelOrEnergyCost     float64 `json:"fuelOrEnergyCost"`
	InsuranceCost        float64 `json:"insuranceCost"`
	MaintenanceCost      float64 `json:"maintenanceCost"`
	FeesCost             float64 `json:"feesCost"`
	TotalOutflow         float64 `json:"totalOutflow"`
	EndingVehicleValue   float64 `json:"endingVehicleValue"`
	RemainingLoanBalance float64 `json:"remainingLoanBalance"`
}

// TCOResult contains the complete total cost of ownership analysis.
type TCOResult struct {
	Input                TCOInput              `json:"input"`
	TotalCostOfOwnership float64               `json:"totalCostOfOwnership"` // Total out-of-pocket spend during ownership
	ResidualValue        float64               `json:"residualValue"`        // Estimated vehicle worth at the end
	NetCostOfOwnership   float64               `json:"netCostOfOwnership"`   // Total out-of-pocket minus residual value
	MonthlyAverageCost   float64               `json:"monthlyAverageCost"`   // Net cost divided by total months
	CostPerMile          float64               `json:"costPerMile"`          // Net cost divided by total miles
	Categories           CostCategoryBreakdown `json:"categories"`
	Yearly               []YearlyBreakdown     `json:"yearly"`
}
