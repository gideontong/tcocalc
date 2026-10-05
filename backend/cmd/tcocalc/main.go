package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/gideontong/tcocalc/backend/pkg/tco"
	"github.com/spf13/cobra"
)

var (
	formatFlag string
	fileFlag   string

	// Flags for CLI input
	vehicleNameFlag  string
	powertrainFlag   string
	acquisitionFlag  string
	priceFlag        float64
	downPaymentFlag  float64
	taxRateFlag      float64
	termMonthsFlag   int
	interestFlag     float64
	yearsFlag        int
	mileageFlag      float64
	mpgFlag          float64
	fuelPriceFlag    float64
	efficiencyFlag   float64
	electricRate     float64
	insuranceFlag    float64
	maintenanceFlag  float64
	feesFlag         float64
	depreciation     float64

	// Lease-specific flags
	leaseMonthsFlag   int
	leaseDueFlag      float64
	leaseMonthlyFlag  float64
	leaseMFFlag       float64
	leaseResidualRate float64
	leaseAcqFeeFlag   float64
	leaseDispFeeFlag  float64
	leaseMileageLimit float64
	leaseExcessFee    float64
	leaseBuyoutFlag   bool
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "tcocalc",
		Short: "tcocalc calculates the total cost of ownership for driving a vehicle",
		Long: `tcocalc is a vehicle Total Cost of Ownership (TCO) calculator.
It provides comprehensive lifecycle cost breakdowns including depreciation,
financing interest, fuel/electricity, insurance, maintenance, and fees across
Cash Purchase, Loan Financing, and Vehicle Lease options.`,
		RunE: runCalculate,
	}

	rootCmd.Flags().StringVarP(&formatFlag, "format", "o", "table", "Output format (table or json)")
	rootCmd.Flags().StringVarP(&fileFlag, "file", "f", "", "Path to JSON input file")

	rootCmd.Flags().StringVar(&vehicleNameFlag, "name", "Sample Vehicle", "Vehicle name/model")
	rootCmd.Flags().StringVar(&powertrainFlag, "powertrain", "gas", "Vehicle powertrain (gas, hybrid, electric)")
	rootCmd.Flags().StringVarP(&acquisitionFlag, "acquisition", "a", "loan", "Acquisition mode (cash, loan, lease)")
	rootCmd.Flags().Float64Var(&priceFlag, "price", 35000, "Vehicle purchase price ($)")
	rootCmd.Flags().Float64Var(&downPaymentFlag, "down", 5000, "Down payment ($)")
	rootCmd.Flags().Float64Var(&taxRateFlag, "tax-rate", 7.5, "Sales tax rate (%)")
	rootCmd.Flags().IntVar(&termMonthsFlag, "loan-months", 60, "Loan duration in months (0 for cash)")
	rootCmd.Flags().Float64Var(&interestFlag, "interest-rate", 5.5, "Annual loan interest rate (%)")
	rootCmd.Flags().IntVarP(&yearsFlag, "years", "y", 10, "Ownership duration in years")
	rootCmd.Flags().Float64VarP(&mileageFlag, "mileage", "m", 12000, "Annual mileage (miles/year)")
	rootCmd.Flags().Float64Var(&mpgFlag, "mpg", 30.0, "Fuel economy in MPG (gas/hybrid)")
	rootCmd.Flags().Float64Var(&fuelPriceFlag, "fuel-price", 3.80, "Fuel price per gallon ($)")
	rootCmd.Flags().Float64Var(&efficiencyFlag, "kwh-per-100mi", 28.0, "EV efficiency (kWh/100 miles)")
	rootCmd.Flags().Float64Var(&electricRate, "electric-rate", 0.16, "Electricity rate ($/kWh)")
	rootCmd.Flags().Float64Var(&insuranceFlag, "insurance", 1500, "Annual insurance cost ($)")
	rootCmd.Flags().Float64Var(&maintenanceFlag, "maintenance", 800, "Annual maintenance and tires ($)")
	rootCmd.Flags().Float64Var(&feesFlag, "fees", 300, "Annual registration and fees ($)")
	rootCmd.Flags().Float64Var(&depreciation, "depreciation-rate", 15.0, "Annual depreciation rate (%)")

	// Lease flags
	rootCmd.Flags().IntVar(&leaseMonthsFlag, "lease-months", 36, "Lease term in months (e.g. 24, 36, 48)")
	rootCmd.Flags().Float64Var(&leaseDueFlag, "lease-due-at-signing", 3000, "Total cash due at lease signing ($)")
	rootCmd.Flags().Float64Var(&leaseMonthlyFlag, "lease-monthly", 0, "Direct monthly lease payment quote ($)")
	rootCmd.Flags().Float64Var(&leaseMFFlag, "lease-money-factor", 0.0022, "Lease rent charge factor (e.g. 0.0022)")
	rootCmd.Flags().Float64Var(&leaseResidualRate, "lease-residual-rate", 55.0, "Contract residual percentage of MSRP (%)")
	rootCmd.Flags().Float64Var(&leaseAcqFeeFlag, "lease-acq-fee", 695, "Upfront bank acquisition fee ($)")
	rootCmd.Flags().Float64Var(&leaseDispFeeFlag, "lease-disp-fee", 395, "End-of-lease vehicle disposition fee ($)")
	rootCmd.Flags().Float64Var(&leaseMileageLimit, "lease-mileage-limit", 12000, "Contract annual mileage allowance (miles/yr)")
	rootCmd.Flags().Float64Var(&leaseExcessFee, "lease-excess-fee", 0.25, "Excess mileage penalty rate ($/mile)")
	rootCmd.Flags().BoolVar(&leaseBuyoutFlag, "lease-buyout", false, "Exercise vehicle purchase buyout at lease end")

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func runCalculate(cmd *cobra.Command, args []string) error {
	var input tco.TCOInput

	if fileFlag != "" {
		data, err := os.ReadFile(fileFlag)
		if err != nil {
			return fmt.Errorf("failed to read input file: %w", err)
		}
		if err := json.Unmarshal(data, &input); err != nil {
			return fmt.Errorf("failed to parse JSON input file: %w", err)
		}
	} else {
		input = tco.TCOInput{
			VehicleName:           vehicleNameFlag,
			Powertrain:            tco.PowertrainType(powertrainFlag),
			Acquisition:           tco.AcquisitionType(acquisitionFlag),
			PurchasePrice:         priceFlag,
			DownPayment:           downPaymentFlag,
			SalesTaxRate:          taxRateFlag,
			LoanTermMonths:        termMonthsFlag,
			LoanInterestRate:      interestFlag,
			OwnershipYears:        yearsFlag,
			AnnualMileage:         mileageFlag,
			FuelEconomyMPG:        mpgFlag,
			FuelPricePerGal:       fuelPriceFlag,
			EfficiencyKWhPer100Mi: efficiencyFlag,
			ElectricityRatePerKWh: electricRate,
			AnnualInsurance:       insuranceFlag,
			AnnualMaintenance:     maintenanceFlag,
			AnnualFees:            feesFlag,
			DepreciationRate:      depreciation,
		}

		if input.Acquisition == tco.AcquisitionLease {
			input.Lease = &tco.LeaseInput{
				LeaseTermMonths:      leaseMonthsFlag,
				DueAtSigning:         leaseDueFlag,
				MonthlyPayment:       leaseMonthlyFlag,
				MoneyFactor:          leaseMFFlag,
				ResidualPercent:      leaseResidualRate,
				AcquisitionFee:       leaseAcqFeeFlag,
				DispositionFee:       leaseDispFeeFlag,
				AnnualMileageLimit:   leaseMileageLimit,
				ExcessMileageFeeRate: leaseExcessFee,
				BuyoutAtEnd:          leaseBuyoutFlag,
			}
		}
	}

	result, err := tco.Calculate(input)
	if err != nil {
		return fmt.Errorf("calculation error: %w", err)
	}

	if formatFlag == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	}

	printTable(result)
	return nil
}

func printTable(r *tco.TCOResult) {
	fmt.Println("================================================================================")
	fmt.Printf(" TOTAL COST OF OWNERSHIP REPORT: %s (%s, %s)\n", r.Input.VehicleName, r.Input.Powertrain, r.Acquisition)
	fmt.Println("================================================================================")
	fmt.Printf(" Ownership Period:       %d years (%0.0f miles/year, %0.0f total miles)\n",
		r.Input.OwnershipYears, r.Input.AnnualMileage, r.Input.AnnualMileage*float64(r.Input.OwnershipYears))
	fmt.Printf(" Purchase / MSRP Price:  $%.2f\n", r.Input.PurchasePrice)
	if r.Acquisition == tco.AcquisitionLease && !r.Input.Lease.BuyoutAtEnd {
		fmt.Printf(" Residual Value:         $%.2f (Vehicle Returned)\n", r.ResidualValue)
	} else {
		fmt.Printf(" Estimated Residual:     $%.2f\n", r.ResidualValue)
	}
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Printf(" SUMMARY METRICS\n")
	fmt.Printf("   Net Cost of Ownership:    $%.2f\n", r.NetCostOfOwnership)
	fmt.Printf("   Monthly Average Cost:     $%.2f / month\n", r.MonthlyAverageCost)
	fmt.Printf("   Cost Per Mile:            $%.3f / mile\n", r.CostPerMile)
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Printf(" CATEGORY BREAKDOWN\n")
	fmt.Printf("   Depreciation / Base:      $%.2f\n", r.Categories.Depreciation)
	fmt.Printf("   Financing / Rent Charge:  $%.2f\n", r.Categories.FinancingInterest)
	fmt.Printf("   Fuel / Energy:            $%.2f\n", r.Categories.FuelOrEnergy)
	fmt.Printf("   Insurance:                $%.2f\n", r.Categories.Insurance)
	fmt.Printf("   Maintenance & Tires:      $%.2f\n", r.Categories.Maintenance)
	fmt.Printf("   Taxes, Fees & Penalties:  $%.2f\n", r.Categories.TaxesAndFees)
	fmt.Println("--------------------------------------------------------------------------------")
	fmt.Printf(" YEAR-BY-YEAR SCHEDULE\n")
	fmt.Printf("  Year | Depreciation | Payment/Debt | Energy  | Insurance | Maint | Value End\n")
	fmt.Printf("  ----------------------------------------------------------------------------\n")
	for _, y := range r.Yearly {
		pmt := y.LoanPayment
		if r.Acquisition == tco.AcquisitionLease {
			pmt = y.LeasePayment
		}
		fmt.Printf("  %4d | $%11.2f | $%11.2f | $%6.2f | $%8.2f | $%5.2f | $%9.2f\n",
			y.Year, y.DepreciationCost, pmt, y.FuelOrEnergyCost, y.InsuranceCost, y.MaintenanceCost, y.EndingVehicleValue)
	}
	fmt.Println("================================================================================")
}
