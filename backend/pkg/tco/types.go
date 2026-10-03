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

// AcquisitionType defines how the vehicle was acquired (cash purchase, loan financing, or lease).
type AcquisitionType string

const (
	AcquisitionCash  AcquisitionType = "cash"
	AcquisitionLoan  AcquisitionType = "loan"
	AcquisitionLease AcquisitionType = "lease"
)

// LeaseInput encapsulates parameters for a vehicle lease agreement.
type LeaseInput struct {
	LeaseTermMonths      int     `json:"leaseTermMonths"`      // Typically 24, 36, or 48 months
	DueAtSigning         float64 `json:"dueAtSigning"`         // Down payment / cap cost reduction + upfront fees ($)
	MonthlyPayment       float64 `json:"monthlyPayment"`       // Direct contract monthly lease payment ($)
	MoneyFactor          float64 `json:"moneyFactor"`          // Lease rent charge factor (e.g. 0.0025)
	ResidualPercent      float64 `json:"residualPercent"`      // Residual % of MSRP (e.g. 58.0 for 58%)
	AcquisitionFee       float64 `json:"acquisitionFee"`       // Upfront bank acquisition fee ($)
	DispositionFee       float64 `json:"dispositionFee"`       // End-of-lease vehicle turn-in fee ($)
	AnnualMileageLimit   float64 `json:"annualMileageLimit"`   // Contract mileage allowance per year (e.g. 12000)
	ExcessMileageFeeRate float64 `json:"excessMileageFeeRate"` // Fee per excess mile ($/mile, e.g. 0.25)
	BuyoutAtEnd          bool    `json:"buyoutAtEnd"`          // Whether user exercises buyout option at lease maturity
}

// TCOInput encapsulates the input parameters needed to calculate total cost of ownership.
type TCOInput struct {
	VehicleName           string          `json:"vehicleName"`
	Powertrain            PowertrainType  `json:"powertrain"`
	Acquisition           AcquisitionType `json:"acquisition"`           // "cash", "loan", or "lease" (default: "loan")
	PurchasePrice         float64         `json:"purchasePrice"`         // MSRP or negotiated purchase price
	DownPayment           float64         `json:"downPayment"`           // Cash down payment (for loan/cash)
	SalesTaxRate          float64         `json:"salesTaxRate"`          // Percentage, e.g., 7.5 for 7.5%
	LoanTermMonths        int             `json:"loanTermMonths"`        // 0 if cash purchase
	LoanInterestRate      float64         `json:"loanInterestRate"`      // Annual APR percentage, e.g. 5.5 for 5.5%
	Lease                 *LeaseInput     `json:"lease,omitempty"`       // Required when Acquisition == "lease"
	OwnershipYears        int             `json:"ownershipYears"`        // Duration in years (e.g. 5)
	AnnualMileage         float64         `json:"annualMileage"`         // Miles driven per year
	FuelEconomyMPG        float64         `json:"fuelEconomyMPG"`        // Applicable for gas / hybrid
	FuelPricePerGal       float64         `json:"fuelPricePerGal"`       // Applicable for gas / hybrid ($/gal)
	EfficiencyKWhPer100Mi float64         `json:"efficiencyKWhPer100Mi"` // Applicable for electric (kWh per 100 miles)
	ElectricityRatePerKWh float64         `json:"electricityRatePerKWh"` // Applicable for electric ($/kWh)
	AnnualInsurance       float64         `json:"annualInsurance"`       // Estimated annual insurance cost
	AnnualMaintenance     float64         `json:"annualMaintenance"`     // Estimated annual maintenance & tires
	AnnualFees            float64         `json:"annualFees"`            // Annual registration, inspections, and taxes
	DepreciationRate      float64         `json:"depreciationRate"`      // Annual value loss percentage, e.g. 15.0 for 15%
}

// Normalize sets sensible defaults for optional or missing fields.
func (in *TCOInput) Normalize() {
	in.Acquisition = AcquisitionType(strings.ToLower(string(in.Acquisition)))
	if in.Acquisition == "" {
		if in.LoanTermMonths == 0 && in.DownPayment >= in.PurchasePrice && in.PurchasePrice > 0 {
			in.Acquisition = AcquisitionCash
		} else {
			in.Acquisition = AcquisitionLoan
		}
	}

	if in.Acquisition == AcquisitionCash {
		in.LoanTermMonths = 0
		in.LoanInterestRate = 0
		in.DownPayment = in.PurchasePrice
	}

	if in.Acquisition == AcquisitionLease && in.Lease != nil && in.Lease.LeaseTermMonths > 0 {
		// Synchronize ownership duration to lease contract length
		leaseYears := (in.Lease.LeaseTermMonths + 11) / 12
		if leaseYears < 1 {
			leaseYears = 1
		}
		in.OwnershipYears = leaseYears
	}
}

// Validate checks for logical consistency and invalid ranges in the input.
func (in *TCOInput) Validate() error {
	in.Normalize()

	if in.PurchasePrice <= 0 {
		return errors.New("purchasePrice must be greater than zero")
	}
	if in.OwnershipYears <= 0 {
		return errors.New("ownershipYears must be at least 1")
	}
	if in.AnnualMileage < 0 {
		return errors.New("annualMileage cannot be negative")
	}
	if in.SalesTaxRate < 0 || in.DepreciationRate < 0 {
		return errors.New("rates cannot be negative")
	}

	switch in.Acquisition {
	case AcquisitionCash:
		// Cash purchase needs no further loan validation
	case AcquisitionLoan:
		if in.DownPayment < 0 || in.DownPayment > in.PurchasePrice {
			return errors.New("downPayment cannot be negative or greater than purchasePrice")
		}
		if in.LoanTermMonths < 0 {
			return errors.New("loanTermMonths cannot be negative")
		}
		if in.LoanInterestRate < 0 {
			return errors.New("loanInterestRate cannot be negative")
		}
	case AcquisitionLease:
		if in.Lease == nil {
			return errors.New("lease details must be provided when acquisition is lease")
		}
		if in.Lease.LeaseTermMonths <= 0 {
			return errors.New("leaseTermMonths must be greater than zero")
		}
		if in.Lease.DueAtSigning < 0 {
			return errors.New("dueAtSigning cannot be negative")
		}
		if in.Lease.MonthlyPayment <= 0 && (in.Lease.MoneyFactor <= 0 || in.Lease.ResidualPercent <= 0) {
			return errors.New("either monthlyPayment or both moneyFactor and residualPercent must be specified for lease")
		}
		if in.Lease.ResidualPercent < 0 || in.Lease.ResidualPercent > 100 {
			return errors.New("residualPercent must be between 0 and 100")
		}
	default:
		return fmt.Errorf("unsupported acquisition mode: %q (expected cash, loan, or lease)", in.Acquisition)
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
	LeasePayment         float64 `json:"leasePayment,omitempty"`
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
	Acquisition          AcquisitionType       `json:"acquisition"`          // "cash", "loan", or "lease"
	TotalCostOfOwnership float64               `json:"totalCostOfOwnership"` // Total out-of-pocket spend during ownership
	ResidualValue        float64               `json:"residualValue"`        // Estimated vehicle worth at the end
	NetCostOfOwnership   float64               `json:"netCostOfOwnership"`   // Total out-of-pocket minus residual value
	MonthlyAverageCost   float64               `json:"monthlyAverageCost"`   // Net cost divided by total months
	CostPerMile          float64               `json:"costPerMile"`          // Net cost divided by total miles
	Categories           CostCategoryBreakdown `json:"categories"`
	Yearly               []YearlyBreakdown     `json:"yearly"`
}
