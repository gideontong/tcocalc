# Architecture Specification & Plan: Vehicle Acquisition Modes

- **Date**: 2026-10-02
- **Status**: Completed
- **Authors**: Gideon Tong & Antigravity (gemini-3.8-flash)
- **Relative Path**: `docs/specs/2026-10-02-acquisition-modes.md`

---

## 1. Context & Motivation

In automotive financial modeling, how a vehicle is acquired drastically changes both cash flow timing and lifecycle cost:

1. **Cash Purchase (Fully Purchased)**: One flat upfront capital expenditure. No loan interest, no monthly debt obligations. The buyer absorbs full asset depreciation and retains 100% of the vehicle's residual liquidation value at the end of the ownership horizon.
2. **Loan Financing (Purchased with Loan)**: Upfront down payment followed by fixed amortized monthly payments (principal + interest). The owner incurs financing interest costs and eventually gains full vehicle equity as the debt is discharged.
3. **Vehicle Lease**: Contractual multi-year rental agreement (typically 24, 36, or 48 months). The lessee pays for estimated vehicle depreciation during the term plus a financing rent charge (money factor). At contract maturity, the vehicle is surrendered back to the lessor with $0 residual asset equity, subject to disposition fees and excess mileage penalties—or optionally purchased through a contractual buyout.

Currently, `tcocalc` models cash versus loan financing implicitly via `LoanTermMonths == 0`, and lacks support for vehicle leases. This specification details the plan to introduce explicit acquisition mode toggling across the shared Go engine, CLI, REST API, and Next.js frontend.

---

## 2. Architectural Decisions

Based on design alignment, the following choices are established:

### 2.1 Explicit Acquisition Type Enum

- Introduce a dedicated `AcquisitionType` enum (`cash`, `loan`, `lease`) in both Go (`backend/pkg/tco`) and TypeScript (`frontend/src/lib/tco.ts`).
- When set to `cash`: `LoanTermMonths` is forced to 0, `DownPayment` equals `PurchasePrice`, and financing interest is 0.
- When set to `loan`: Standard loan amortization is modeled using `DownPayment`, `LoanTermMonths`, and `LoanInterestRate`.
- When set to `lease`: Dedicated lease parameters are evaluated, and `OwnershipYears` is synchronized to the lease duration.

### 2.2 Hybrid Lease Financial Model

- The engine will support both common consumer leasing patterns:
  1. **Direct Monthly Quote**: The user provides the contract's monthly payment directly (e.g., $399/mo + $3,000 due at signing).
  2. **Dealership Formula Calculation**: If no direct monthly quote is provided, the engine calculates the lease payment from:
     - **Net Capitalized Cost** = Negotiated Price + Acquisition Fee - Cap Cost Reduction (Down Payment).
     - **Residual Value** = MSRP × Residual Percentage.
     - **Monthly Depreciation** = (Net Cap Cost - Residual Value) / Lease Term Months.
     - **Monthly Rent Charge** = (Net Cap Cost + Residual Value) × Money Factor (or APR / 2400).
     - **Monthly Lease Payment** = Monthly Depreciation + Monthly Rent Charge.

### 2.3 Strict Single-Lease Time Horizon

- In `lease` mode, the analysis horizon is strictly locked to the lease contract duration (e.g., 24, 36, or 48 months converted to years). This prevents speculative assumptions about consecutive future lease rates or terms while providing an accurate evaluation of the specific lease deal.

### 2.4 End-of-Lease Disposition & Optional Buyout

- **Standard Return (Default)**:
  - Lessee surrenders the vehicle at lease end.
  - Residual vehicle asset value is **$0**.
  - A disposition fee (typically $350–$495) is added to final-year costs.
  - If annual mileage exceeds the contract allowance, an excess mileage fee (e.g., $0.25/mile over limit) is assessed.
  - Net Cost of Ownership equals the sum of all lease payments, upfront cash, operating costs, and return fees.
- **Optional Lease Buyout**:
  - If the user toggles "Buyout at End", the lessee purchases the vehicle at lease maturity for the contractual residual value.
  - At the end of the period, the owner retains the fair market residual asset value, offsetting the buyout cost.

### 2.5 Frontend Segmented Tabs UI

- In `frontend/src/app/page.tsx`, the Vehicle & Purchase section will feature a segmented tab selector (`Cash` | `Loan` | `Lease`) at the top of the card.
- Toggling the tab will dynamically reconfigure the visible form inputs:
  - **Cash**: Purchase Price, Sales Tax Rate. (Hides loan term, interest, down payment).
  - **Loan**: Purchase Price, Down Payment, Sales Tax Rate, Loan Term (Months), Interest Rate APR.
  - **Lease**: MSRP / Price, Due at Signing, Lease Term (Months), Monthly Payment (or Money Factor + Residual %), Annual Mileage Allowance, Excess Mileage Fee, Disposition Fee, and Buyout Toggle.

### 2.6 CLI Flags

- Add an `--acquisition` (or `-a`) flag accepting `cash`, `loan`, or `lease` (defaulting to `loan` to preserve backwards compatibility).
- Add lease-specific flags: `--lease-months`, `--lease-due-at-signing`, `--lease-monthly`, `--lease-money-factor`, `--lease-residual-rate`, `--lease-acq-fee`, `--lease-disp-fee`, `--lease-mileage-limit`, `--lease-excess-fee`, and `--lease-buyout`.

---

## 3. Domain Model Specifications

### 3.1 Go Struct Definitions (`backend/pkg/tco/types.go`)

```go
type AcquisitionType string

const (
    AcquisitionCash  AcquisitionType = "cash"
    AcquisitionLoan  AcquisitionType = "loan"
    AcquisitionLease AcquisitionType = "lease"
)

type LeaseInput struct {
    LeaseTermMonths      int     `json:"leaseTermMonths"`      // 24, 36, 48, etc.
    DueAtSigning         float64 `json:"dueAtSigning"`         // Upfront cash out-of-pocket
    MonthlyPayment       float64 `json:"monthlyPayment"`       // Direct contract quote (optional if computing)
    MoneyFactor          float64 `json:"moneyFactor"`          // Dealership rent factor (e.g., 0.0025)
    ResidualPercent      float64 `json:"residualPercent"`      // Residual % of MSRP (e.g., 58.0 for 58%)
    AcquisitionFee       float64 `json:"acquisitionFee"`       // Upfront bank acquisition fee
    DispositionFee       float64 `json:"dispositionFee"`       // End-of-lease vehicle turn-in fee
    AnnualMileageLimit   float64 `json:"annualMileageLimit"`   // Contract allowance (e.g., 10000 or 12000)
    ExcessMileageFeeRate float64 `json:"excessMileageFeeRate"` // Fee per excess mile (e.g., 0.25)
    BuyoutAtEnd          bool    `json:"buyoutAtEnd"`          // Whether user exercises purchase buyout
}

type TCOInput struct {
    VehicleName           string          `json:"vehicleName"`
    Powertrain            PowertrainType  `json:"powertrain"`
    Acquisition           AcquisitionType `json:"acquisition"` // "cash", "loan", "lease"
    PurchasePrice         float64         `json:"purchasePrice"`
    DownPayment           float64         `json:"downPayment"`
    SalesTaxRate          float64         `json:"salesTaxRate"`
    LoanTermMonths        int             `json:"loanTermMonths"`
    LoanInterestRate      float64         `json:"loanInterestRate"`
    Lease                 *LeaseInput     `json:"lease,omitempty"` // Present when Acquisition == "lease"
    OwnershipYears        int             `json:"ownershipYears"`
    AnnualMileage         float64         `json:"annualMileage"`
    FuelEconomyMPG        float64         `json:"fuelEconomyMPG"`
    FuelPricePerGal       float64         `json:"fuelPricePerGal"`
    EfficiencyKWhPer100Mi float64         `json:"efficiencyKWhPer100Mi"`
    ElectricityRatePerKWh float64         `json:"electricityRatePerKWh"`
    AnnualInsurance       float64         `json:"annualInsurance"`
    AnnualMaintenance     float64         `json:"annualMaintenance"`
    AnnualFees            float64         `json:"annualFees"`
    DepreciationRate      float64         `json:"depreciationRate"`
}
```

### 3.2 Output & Cost Categories

In `TCOResult`:

- **For Cash / Loan**:
  - `Categories.Depreciation`: Total loss of vehicle market value over the ownership duration.
  - `Categories.FinancingInterest`: Loan interest paid over the financing term.
  - `ResidualValue`: Estimated market value at end of period.
  - `NetCostOfOwnership`: `TotalCostOfOwnership + RemainingLoanBalance - ResidualValue`.
- **For Lease (Standard Return)**:
  - `Categories.Depreciation`: Total depreciation component of monthly lease payments.
  - `Categories.FinancingInterest`: Total rent charges (finance charge) across lease payments.
  - `Categories.TaxesAndFees`: Upfront lease sales tax, acquisition fee, disposition fee, annual fees, and any excess mileage penalties.
  - `ResidualValue`: **$0.00** (vehicle surrendered).
  - `NetCostOfOwnership`: Equals `TotalCostOfOwnership` (net out-of-pocket spend).

---

## 4. Implementation Roadmap

### Phase 1: Shared Go Calculation Engine (`backend/pkg/tco`)

1. Update `types.go` with `AcquisitionType`, `LeaseInput`, and validation methods.
   - Enforce positive `LeaseTermMonths` when in lease mode.
   - Enforce valid `MonthlyPayment` or positive `MoneyFactor` + `ResidualPercent`.
2. Update `calculator.go` to support:
   - Cash purchase path (`AcquisitionCash`).
   - Loan financing path (`AcquisitionLoan`).
   - Lease path (`AcquisitionLease`): Compute monthly payment, year-by-year progression, excess mileage penalty, and return fees.
3. Update `calculator_test.go`:
   - Unit tests for Cash purchase (zero interest, full residual asset).
   - Unit tests for Loan financing.
   - Unit tests for Lease with direct monthly payment.
   - Unit tests for Lease computed via money factor and residual %.
   - Unit tests for Lease with excess mileage penalty.
   - Unit tests for Lease buyout option.

### Phase 2: Go HTTP Server (`backend/cmd/server`)

1. Ensure `POST /api/v1/calculate` parses and validates the new `Acquisition` and `Lease` fields.
2. Add server test cases for each acquisition mode.

### Phase 3: Go CLI (`backend/cmd/tcocalc`)

1. Add Cobra flags for `--acquisition` (`-a`) and lease parameters.
2. Update table output format to reflect "Acquisition: Cash / Loan / Lease" in the report header and category breakdown.
3. Verify CLI execution with `--acquisition=cash` and `--acquisition=lease`.

### Phase 4: Frontend Implementation (`frontend/`)

1. Update `frontend/src/lib/tco.ts` with TypeScript types and lease calculation logic matching Go.
2. Add unit tests in `frontend/src/lib/tco.test.ts` verifying parity with Go engine.
3. Update `frontend/src/app/page.tsx`:
   - Add segmented control/tabs (`Cash`, `Loan`, `Lease`).
   - Conditionally render inputs depending on the active acquisition mode.
   - Update quick presets (e.g., lease presets for luxury/EV).
   - Ensure results cards accurately convey residual value ($0 for lease return, positive for purchase/buyout).
4. Update `frontend/src/app/page.test.tsx` to test tab switching and calculations.

### Phase 5: Verification & Quality Assurance

1. Run `make test` (backend unit tests + frontend vitest).
2. Run `make lint` (`golangci-lint`, `go vet`, ESLint, Prettier format check).
3. Test `./start.sh` and verify live UI behavior on `http://localhost:8080`.

---

## 5. Testing & Quality Criteria

| Area                      | Minimum Requirement                                                                                                               |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Backend Go Unit Tests** | Maintain >= 90% statement coverage in `pkg/tco`. Test all edge cases (zero down, high mileage lease, lease buyout).               |
| **Frontend Unit Tests**   | Component tests in `page.test.tsx` verifying tab switching re-renders inputs and updates calculated metrics.                      |
| **Parity Verification**   | Direct comparison test ensuring identical mathematical output between Go CLI and TypeScript frontend for all 3 acquisition modes. |
| **Documentation & Style** | All documentation uses relative paths; Prettier check passes repository-wide.                                                     |
