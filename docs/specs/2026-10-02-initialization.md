# Project Initialization Specification & Plan: tcocalc

- **Date**: 2026-10-02
- **Status**: Approved / In Progress
- **Authors**: Gideon Tong & Antigravity (gemini-3.8-flash)
- **Document ID**: `docs/specs/2026-10-02-initialization.md`

---

## 1. Executive Summary

`tcocalc` is an application designed to compute the **Total Cost of Ownership (TCO)** for driving a vehicle across its lifecycle. The system provides users with clear financial visibility into vehicle expenses, comparing gas (ICE), hybrid, and electric (EV) vehicles across purchase/financing costs, depreciation, energy/fuel, insurance, routine maintenance, and government fees.

The project consists of:

1. **Shared Go Core Engine**: A robust, pure Go calculation package (`backend/pkg/tco`).
2. **Go REST API Server**: A lightweight, stateless HTTP service (`backend/cmd/server`) exposing the calculation engine via JSON endpoints.
3. **Go Command-Line Utility (CLI)**: A developer- and automation-friendly CLI (`backend/cmd/tcocalc`) built with Cobra, supporting both structured JSON and formatted tabular terminal output.
4. **Next.js Web Frontend**: A modern, responsive web application (`frontend/`) built with Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui components.
5. **Quality & Tooling Pipeline**: Comprehensive unit testing (`go test`, `vitest`), strict linting (`golangci-lint`, `eslint`), and repository-wide Markdown formatting with Prettier orchestrated via a root `Makefile`.

---

## 2. Key Architectural Decisions

Through the initial design alignment process, the following architectural choices were established:

### 2.1 Repository Structure

- **Monorepo with Dedicated Directories**:
  - `backend/`: Independent Go module containing `go.mod`, `cmd/server/`, `cmd/tcocalc/`, and `pkg/tco/`.
  - `frontend/`: Independent Next.js project containing `package.json`, React components, styles, and unit tests.
  - `docs/specs/`: Specifications, architecture decision records, and planning files.
  - Root: Orchestration `Makefile`, Prettier configuration for markdown, and `AGENTS.md`.

### 2.2 Shared Go Architecture

- `backend/pkg/tco/` holds pure, deterministic financial calculation logic without network or database dependencies.
- Both the HTTP server (`cmd/server`) and CLI (`cmd/tcocalc`) import `backend/pkg/tco` directly, guaranteeing zero logic divergence between web and CLI calculations.

### 2.3 Stateless Operation

- The calculation engine is stateless for the initial release: inputs are received via request body (HTTP) or flags/config (CLI), and computed outputs are returned immediately. No persistent database is required for core calculations.

### 2.4 Frontend Stack

- Framework: Next.js (App Router) with TypeScript.
- UI Component Library: Tailwind CSS + shadcn/ui.
- Unit Testing: Vitest + React Testing Library.
- Linting: ESLint + Prettier.

### 2.5 Markdown Formatting

- Prettier is configured repository-wide for Markdown linting and formatting.

---

## 3. Domain Model & Calculation Logic

### 3.1 Input Parameters (`TCOInput`)

| Parameter           | Type    | Unit / Description                         | Default / Example |
| :------------------ | :------ | :----------------------------------------- | :---------------- |
| `VehicleName`       | string  | Display label (e.g., "2024 Tesla Model 3") | Required          |
| `Powertrain`        | string  | `gas`, `hybrid`, `electric`                | `gas`             |
| `PurchasePrice`     | float64 | Vehicle purchase price                     | \$35,000          |
| `DownPayment`       | float64 | Upfront cash paid                          | \$5,000           |
| `SalesTaxRate`      | float64 | Percentage (e.g., 8.5 for 8.5%)            | 7.0%              |
| `LoanTermMonths`    | int     | Length of loan in months (0 for cash)      | 60                |
| `LoanInterestRate`  | float64 | Annual percentage rate (APR)               | 5.5%              |
| `OwnershipYears`    | int     | Duration of ownership to model             | 5 years           |
| `AnnualMileage`     | float64 | Miles driven per year                      | 12,000 miles      |
| `FuelEconomyMPG`    | float64 | Miles per gallon (for gas / hybrid)        | 30 MPG            |
| `FuelPricePerGal`   | float64 | Fuel price per gallon                      | \$3.80            |
| `EfficiencyKWh`     | float64 | Energy efficiency kWh / 100 miles (EV)     | 26 kWh/100mi      |
| `ElectricityRate`   | float64 | Rate per kWh ($)                           | \$0.16/kWh        |
| `AnnualInsurance`   | float64 | Estimated annual insurance premium         | \$1,500           |
| `AnnualMaintenance` | float64 | Estimated annual maintenance & tires       | \$800             |
| `AnnualFees`        | float64 | Registration, inspection, license fees     | \$300             |
| `DepreciationRate`  | float64 | Annual percentage value loss               | 15.0%             |

### 3.2 Output Metrics (`TCOResult`)

1. **Total Cost of Ownership ($)**: Aggregate sum across all expense categories over the ownership period.
2. **Net Cost ($)**: Total expenditures minus residual vehicle value upon sale.
3. **Monthly Average Cost ($/month)**: Total cost divided by total ownership months.
4. **Cost Per Mile ($/mile)**: Total cost divided by total lifetime miles driven.
5. **Categorized Breakdown**:
   - Depreciation expense (Purchase price - Residual value).
   - Financing Interest (Total loan payments - Principal).
   - Energy / Fuel expense (Total fuel/electricity consumed × price).
   - Insurance expense (Annual insurance × years).
   - Maintenance & Repair expense (Annual maintenance × years).
   - Taxes & Registration fees (Upfront sales tax + annual fees × years).
6. **Year-by-Year Schedule**:
   - Array of yearly snapshots showing depreciation, fuel, insurance, maintenance, loan balance, and cumulative spend.

---

## 4. Backend Implementation Plan

### 4.1 Go Core Package (`backend/pkg/tco`)

- `types.go`: Definition of `TCOInput`, `TCOResult`, `YearlyBreakdown`, `PowertrainType`, and validation methods.
- `calculator.go`: Pure calculation engine implementing loan amortization, compound depreciation, fuel/electricity cost models, and aggregate metrics.
- `calculator_test.go`: Comprehensive unit tests verifying cash purchase vs loan financing, EV vs ICE calculations, boundary conditions, and floating-point precision.

### 4.2 REST API Server (`backend/cmd/server`)

- `main.go`: HTTP server setup with graceful shutdown.
- Handlers:
  - `GET /healthz`: Health check endpoint returning `{ "status": "ok" }`.
  - `POST /api/v1/calculate`: Accepts `TCOInput` JSON, validates input, returns `TCOResult` JSON.
  - CORS middleware enabled for local Next.js frontend development.

### 4.3 Command-Line Utility (`backend/cmd/tcocalc`)

- Cobra-based CLI supporting:
  - Subcommand: `tcocalc calculate [flags]` or `tcocalc run -f input.json`.
  - Flags for all common inputs (`--price`, `--years`, `--miles`, `--mpg`, `--fuel-price`, etc.).
  - Output formats: `--format=table` (default formatted CLI summary) and `--format=json` (clean JSON for scripts).

### 4.4 Go Tooling & Quality

- `golangci-lint`: Configured via `.golangci.yml` in `backend/`.
- Unit tests: `go test -v -race -cover ./...`.

---

## 5. Frontend Implementation Plan

### 5.1 Next.js Application (`frontend/`)

- Framework: Next.js 15+ (App Router) with TypeScript.
- Styling: Tailwind CSS configured with CSS variables.
- Component System: shadcn/ui components (`Button`, `Card`, `Input`, `Label`, `Slider`, `Select`, `Table`, `Tabs`).
- Pages & Features:
  - Interactive vehicle cost calculator form with presets (e.g., standard Sedan ICE, SUV Hybrid, EV).
  - Real-time or submit-triggered calculation against backend API (or local client fallback).
  - Visual summary cards: Monthly Cost, Cost Per Mile, Total Cost.
  - Visual breakdown chart/table (Depreciation, Fuel, Insurance, Maintenance, Taxes).
  - Comparison mode comparing two vehicles side-by-side.

### 5.2 Frontend Testing & Quality

- Test Runner: Vitest + `@testing-library/react`.
- Component Tests: Form input validation, calculation display, and responsiveness.
- Linting: ESLint + Prettier.

---

## 6. Repository-Wide Developer Experience & Makefile

A root `Makefile` orchestrates workflows:

- `make build`: Compiles backend binaries (`bin/tcocalc`, `bin/server`) and builds the frontend.
- `make test`: Runs `go test ./...` in `backend/` and `npm test` in `frontend/`.
- `make lint`: Runs `golangci-lint` in `backend/`, ESLint in `frontend/`, and Prettier format-check for Markdown.
- `make format`: Runs `npx prettier --write "**/*.md"` and code formatters.

---

## 7. Delivery Checklist

- [x] Initial specification and plan created: `docs/specs/2026-10-02-initialization.md`
- [x] Documentation directory indexed: `docs/specs/README.md`
- [x] Create `AGENTS.md` with guidelines, `nvm use lts`, plan convention, and git trailers
- [x] Create root `Makefile` and Prettier markdown linting configuration
- [x] Initialize `backend/` Go module with `pkg/tco`, tests, `cmd/server`, and `cmd/tcocalc`
- [x] Initialize `frontend/` Next.js application with TypeScript, Tailwind, shadcn/ui, and Vitest
- [x] Create `start.sh` orchestration script for concurrent development
- [x] Verify all tests, linters, and format checks pass
