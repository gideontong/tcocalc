# Specification: Optional Depreciation and End-of-Horizon Vehicle Sale

## Context & Motivation

Previously, `tcocalc` unconditionally modeled annual vehicle depreciation across all Cash Purchase and Loan Financing scenarios and subtracted the resulting `residualValue` from `NetCostOfOwnership`.

For buyers who plan to keep their vehicle beyond the analysis horizon or drive it until the end of its useful life without reselling, subtracting theoretical liquidation proceeds artificially lowers the reported Net Ownership Cost, Monthly Average Cost, and Cost Per Mile.

This specification makes depreciation **opt-in** in Cash and Loan modes by allowing the user to explicitly choose whether they will **sell the vehicle at the end of the analysis horizon**.

---

## Architectural Decisions

### 1. Opt-In Vehicle Liquidation (`sellAtEnd`)

- A new boolean field `sellAtEnd` (`SellAtEnd` in Go) is added to `TCOInput`.
- **Default State**: `sellAtEnd` defaults to `false` on new vehicles (`frontend/src/lib/defaults.ts`), making depreciation and resale deduction opt-in while preserving `depreciationRate: 13.0` as the ready default rate when toggled on.
- **When `sellAtEnd == false` (Cash / Loan)**:
  - Annual depreciation and vehicle valuation are not computed (`depreciationCost = 0`, `endingVehicleValue = 0`, `residualValue = 0`).
  - `NetCostOfOwnership = TotalCostOfOwnership + RemainingLoanBalance`.
- **When `sellAtEnd == true` (Cash / Loan)**:
  - Annual compound depreciation (`depreciationRate`) is applied each year to compute `depreciationCost`, `endingVehicleValue`, and final `residualValue`.
  - `NetCostOfOwnership = TotalCostOfOwnership + RemainingLoanBalance - ResidualValue`.
- **Vehicle Lease Mode**:
  - Lease end-of-term disposition is governed by the contract residual (`residualPercent`) and the `buyoutAtEnd` option in `AcquisitionForm`.
  - The `sellAtEnd` toggle and `depreciationRate` input in `UsageForm` are hidden during Lease mode.

### 2. Conditional Form Controls (`UsageForm`)

- In `frontend/src/components/calculator/usage-form.tsx`:
  - When `input.acquisition !== "lease"`, render a **"Sell vehicle at end of horizon"** checkbox control (`id="sellAtEnd"`).
  - Only render the **Depreciation Rate (%/yr)** number input when `input.acquisition !== "lease" && Boolean(input.sellAtEnd)` is `true`.

### 3. Dynamic Dashboard Adaptation

- **`SummaryCards` (`frontend/src/components/calculator/summary-cards.tsx`)**:
  - **Net Ownership Cost** subtitle displays `"total out-of-pocket & remaining debt"` when `acquisition !== "lease" && !input.sellAtEnd`, and `"after vehicle liquidation"` when `input.sellAtEnd` is `true` (or on lease buyout).
  - **Residual Value** card displays `$0.00` with subtitle `"not selling at end ($0 liquidation)"` when `acquisition !== "lease" && !input.sellAtEnd`.
- **`BreakdownCard` (`frontend/src/components/calculator/breakdown-card.tsx`)**:
  - Omits the `Depreciation` category row when `acquisition !== "lease" && !input.sellAtEnd`.
- **`ScheduleTable` (`frontend/src/components/calculator/schedule-table.tsx`)**:
  - Omits the `"Vehicle Value"` line from the progression chart when `acquisition !== "lease" && !input.sellAtEnd` (or when a lease is returned without buyout).
  - Omits the `Depreciation` and `Value End` columns from the annual progression table when `acquisition !== "lease" && !input.sellAtEnd`.

---

## Domain Models & Data Structures

### Backend (`backend/pkg/tco/types.go`)

```go
type TCOInput struct {
	// ... existing fields ...
	AnnualFees            float64         `json:"annualFees"`            // Annual registration, inspections, and taxes
	SellAtEnd             bool            `json:"sellAtEnd"`             // Whether vehicle is sold/liquidated at end of horizon
	DepreciationRate      float64         `json:"depreciationRate"`      // Annual value loss percentage, e.g. 15.0 for 15%
}
```

### Frontend (`frontend/src/lib/tco.ts`)

```typescript
export interface TCOInput {
  // ... existing fields ...
  annualFees: number;
  sellAtEnd?: boolean;
  depreciationRate: number;
}
```

---

## Implementation & Verification Roadmap

1. **Core Calculation Engines**:
   - Update `backend/pkg/tco/types.go` and `backend/pkg/tco/calculator.go` to gate annual depreciation and residual value subtraction on `in.SellAtEnd`.
   - Mirror calculation logic in `frontend/src/lib/tco.ts` and set `sellAtEnd: false` in `frontend/src/lib/defaults.ts`.
2. **UI Components**:
   - Update `frontend/src/components/calculator/usage-form.tsx` and `frontend/src/app/page.tsx` to wire the `sellAtEnd` toggle and conditional `depreciationRate` field.
   - Update `summary-cards.tsx`, `breakdown-card.tsx`, and `schedule-table.tsx` to adapt labels, rows, chart series, and table columns.
3. **Unit & Integration Tests**:
   - Expand `backend/pkg/tco/calculator_test.go` and `frontend/src/lib/tco.test.ts` to verify both `sellAtEnd: false` and `sellAtEnd: true`.
   - Expand `frontend/src/components/calculator/__tests__/calculator-components.test.tsx` and `frontend/src/app/page.test.tsx` to verify conditional UI rendering and state updates.

---

## Testing & Quality Criteria

1. **Unit Tests**:
   - Go backend tests (`cd backend && go test -v -race -cover ./...`) verify zero residual/depreciation when `SellAtEnd: false` and accurate compound depreciation when `SellAtEnd: true`.
   - Frontend Vitest suite (`cd frontend && npm test`) covers calculation parity and UI toggling.
2. **Linting & Formatting**:
   - Zero ESLint or Go vet warnings (`make lint`).
   - Markdown files formatted cleanly with Prettier (`npx prettier --check "**/*.md"`).
