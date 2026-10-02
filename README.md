# tcocalc

Total Cost of Ownership (TCO) calculator for driving a vehicle across its entire lifecycle.

## Overview

`tcocalc` calculates and compares vehicle lifecycle costs across gas (ICE), hybrid, and electric (EV) powertrains. It models:

- Upfront purchase price, down payment, and sales tax
- Loan financing amortization and total interest
- Compound annual depreciation and estimated residual value
- Fuel economy (MPG) and electricity consumption (kWh/100mi)
- Annual insurance, maintenance, tires, and government fees

The project consists of:

- **Core Engine & CLI** (`backend/`): Written in Go with pure calculation domain models (`pkg/tco`), Cobra-powered CLI (`cmd/tcocalc`), and REST API server (`cmd/server`).
- **Web Frontend** (`frontend/`): Next.js (App Router) application styled with Tailwind CSS and shadcn/ui components.
- **Specifications & Documentation** (`docs/specs/`): Architecture decision records, specifications, and plans.
- **Contributor & Agent Guidelines** (`AGENTS.md`): Conventional commits with mandatory git trailers and development workflows.

## Quick Start

### Prerequisites

- Go 1.22+
- Node.js (initialized via `nvm use --lts` or `nvm use lts`)

### Common Commands

```bash
# Build backend CLI and server, plus Next.js frontend
make build

# Run unit tests across Go backend and Next.js frontend
make test

# Run linters (Go vet/golangci-lint, ESLint, Prettier markdown check)
make lint

# Auto-format Markdown documentation
make format
```

### Running the CLI

```bash
# Run CLI with custom arguments
./bin/tcocalc --name "2024 Honda Civic" --powertrain gas --price 28000 --years 5

# Output as JSON
./bin/tcocalc --name "2024 Tesla Model 3" --powertrain electric --price 38000 --format json
```

### Running the Application

```bash
# Start both backend (port 9090) and frontend (port 8080) concurrently
./start.sh
```

- **Frontend UI**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:9090](http://localhost:9090) (Health: `http://localhost:9090/healthz`)
