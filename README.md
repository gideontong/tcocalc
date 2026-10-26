![tcocalc - Total Cost of Ownership Calculator](docs/assets/banner.svg)

# tcocalc

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

**tcocalc** is a comprehensive Total Cost of Ownership (TCO) calculator and multi-vehicle comparison engine. It models every facet of vehicle economics across gas (ICE), hybrid, and electric (EV) powertrains under cash purchase, loan financing, and lease agreements.

---

## Features & Capabilities

### Multi-Powertrain Support

- **Gasoline (ICE)**: Models fuel economy (MPG), fuel price per gallon, and annual fuel expense based on driving mileage.
- **Hybrid (HEV / PHEV)**: Models combined fuel efficiency and operational savings.
- **Electric (BEV)**: Models electrical efficiency (kWh/100 miles) and utility electricity rates ($/kWh).

### Flexible Acquisition Modes

- **Cash Purchase**: Upfront purchase price, sales tax, down payment, and zero financing overhead.
- **Loan Financing**: Configurable down payment, loan term (e.g. 36, 48, 60, 72 months), annual APR, monthly amortization schedule, and cumulative interest charges.
- **Lease Agreements**: Models contract lease terms (e.g. 24, 36, 48 months), cash due at signing, direct monthly quotes or calculation via money factor & contract residual %, bank acquisition fees, vehicle turn-in disposition fees, annual mileage limits, excess mileage penalty rates, and lease buyout options.

### Lifecycle & Operational Cost Modeling

- **Horizon Selection**: Model costs over 1 to 10+ years (default 10-year lifecycle view).
- **Optional Depreciation & Resale Modeling**: Choose whether to sell the vehicle at the end of the ownership horizon:
  - _Sell at end_: Accounts for compound annual depreciation and liquidates residual equity at the end of the analysis period.
  - _Keep vehicle_: Evaluates pure out-of-pocket operational costs without speculative resale equity.
- **Recurring Expenses**: Annual insurance, scheduled maintenance, tire replacements, and government registration fees.

### Visualizations & Comparisons

- **Cost Progression Chart**: Multi-year cumulative cost progression graph powered by Recharts.
- **Year-by-Year Amortization Schedule**: Detailed annual breakdown of loan/lease payments, energy costs, insurance, maintenance, and ending vehicle asset value.
- **Saved Vehicles Comparison**: Save multiple vehicle configurations side-by-side with difference indicators relative to a selected baseline.
- **Metric Toggle Overlays**: Seamlessly compare vehicles by Total Cost, Annual Average, Monthly Average, Cost Per Mile, or Net Cost After Resale.

### Modern Responsive Web UI

- **Sticky Header**: Brand car badge and quick navigation.
- **3-State Theme Toggle**: Switch between **System**, **Light**, and **Dark** modes with automatic OS preference detection and local storage persistence.
- **Full Keyboard & Screen-Reader Accessibility**: Semantic HTML with ARIA controls.

---

## Architecture & Monorepo Structure

```
tcocalc/
├── backend/                  # Core calculation engine & API server in Go
│   ├── cmd/
│   │   ├── tcocalc/          # CLI binary entrypoint (Cobra)
│   │   └── server/           # REST API HTTP server (Standard Library)
│   └── pkg/
│       └── tco/              # Pure domain calculation logic & unit tests
├── frontend/                 # Modern web interface (Next.js 15 App Router)
│   ├── app/                  # App Router pages and root layout
│   └── components/           # UI components (Navbar, Form, Charts, Tables)
├── docs/
│   ├── assets/               # Visual assets (banners, icons)
│   └── specs/                # Architectural decision records and specifications
├── bin/                      # Compiled backend binaries (tcocalc, server)
├── start.sh                  # Development orchestration script
├── Makefile                  # Build, test, lint, and formatting targets
└── AGENTS.md                 # Contributor and AI agent guidelines
```

---

## Quick Start

### Prerequisites

- **Go**: 1.22+ installed
- **Node.js**: LTS version (initialized via `nvm use --lts` or `nvm use lts`)

### Running the Full Application

Start both the backend API server and the Next.js frontend dev server concurrently:

```bash
./start.sh
```

By default, the services run on:

- **Frontend UI**: [http://localhost:8085](http://localhost:8085)
- **Backend API**: [http://localhost:9095](http://localhost:9095) (Health Check: `http://localhost:9095/healthz`)

You can override default ports using environment variables:

```bash
FRONTEND_PORT=3000 BACKEND_PORT=8080 ./start.sh
```

### Deploying to GitHub Pages

The web calculator runs entirely client-side with zero server dependencies and exports as static HTML:

- A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.
- In your repository settings under **Settings > Pages**, set **Source** to **GitHub Actions**.
- Pushes to `master` or `main` automatically build and deploy the application to GitHub Pages.

---

## Monorepo Commands

Use the root `Makefile` for consistent build and verification workflows:

```bash
# Build backend binaries (bin/tcocalc, bin/server) and compile Next.js frontend
make build

# Run unit tests across Go backend and Next.js frontend
make test

# Run linters (Go vet/golangci-lint, ESLint, Prettier markdown check)
make lint

# Automatically format Markdown files across the repository
make format
```

---

## CLI Usage

The Go CLI binary provides rich terminal summaries and machine-readable JSON outputs.

### Building the CLI

```bash
make build-backend
# Or directly:
cd backend && go build -o ../bin/tcocalc ./cmd/tcocalc
```

### Examples

**1. Financed Gas Vehicle (Standard 5-Year Horizon):**

```bash
./bin/tcocalc \
  --name "2024 Honda Civic" \
  --powertrain gas \
  --price 28000 \
  --down 4000 \
  --loan-months 60 \
  --interest-rate 5.5 \
  --mpg 33 \
  --years 5
```

**2. Financed Electric Vehicle with Resale Equity (`--sell-at-end`):**

```bash
./bin/tcocalc \
  --name "2024 Tesla Model 3" \
  --powertrain electric \
  --price 39000 \
  --down 5000 \
  --kwh-per-100mi 25.0 \
  --electric-rate 0.16 \
  --sell-at-end \
  --years 5
```

**3. Vehicle Lease Scenario:**

```bash
./bin/tcocalc \
  --name "2024 Hyundai Ioniq 5" \
  --powertrain electric \
  --acquisition lease \
  --lease-months 36 \
  --lease-due-at-signing 2500 \
  --lease-monthly 389 \
  --lease-mileage-limit 12000
```

**4. JSON Output for Automation / Scripting:**

```bash
./bin/tcocalc --name "Fleet Vehicle" --powertrain gas --price 25000 --format json
```

---

## REST API Reference

The backend provides a fast, lightweight HTTP server for client applications and integrations.

### `GET /healthz`

Health check endpoint.

```bash
curl http://localhost:9095/healthz
```

**Response:**

```json
{
  "status": "ok"
}
```

### `POST /api/v1/calculate`

Calculates total cost of ownership and generates year-by-year amortization schedules.

**Sample Request:**

```bash
curl -X POST http://localhost:9095/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleName": "2024 Honda Civic",
    "powertrain": "gas",
    "acquisition": "loan",
    "purchasePrice": 28000,
    "downPayment": 4000,
    "salesTaxRate": 7.5,
    "loanTermMonths": 60,
    "loanInterestRate": 5.5,
    "ownershipYears": 5,
    "annualMileage": 12000,
    "fuelEconomyMPG": 33.0,
    "fuelPricePerGal": 3.80,
    "annualInsurance": 1400,
    "annualMaintenance": 750,
    "annualFees": 280,
    "depreciationRate": 15.0,
    "sellAtEnd": true
  }'
```

---

## Contributing & Development Guidelines

Please review [AGENTS.md](AGENTS.md) for full operational protocols:

- **Node Versioning**: Run `nvm use --lts` (or `nvm use lts`) before npm operations.
- **Go Standards**: Pure calculation domain logic belongs in `backend/pkg/tco` with accompanying tests.
- **Specifications**: Implementation specs reside in `docs/specs/` and are only created when explicitly requested.
- **Git Commit Standards**: All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) and include the 3 mandatory git trailers:
  ```
  Signed-off-by: Contributor Name <email@example.com>
  Assisted-by: tool/model
  Conversation: <session-uuid>
  ```
