# tcocalc Frontend

The modern web user interface for the **tcocalc** vehicle Total Cost of Ownership calculator, built with [Next.js 15](https://nextjs.org) (App Router), [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), and [Tailwind CSS v4](https://tailwindcss.com).

---

## Overview

The frontend enables users to model, visualize, and compare lifecycle ownership costs for any vehicle:

- **Acquisition Modes**: Cash Purchase, Loan Financing, and Vehicle Lease agreements.
- **Powertrains**: Gas (ICE), Hybrid, and Electric (EV).
- **Interactive Visualizations**: Cumulative multi-year cost charts and yearly amortization breakdown tables.
- **Multi-Vehicle Comparison**: Side-by-side comparison table with baseline difference highlights and metric overlay selectors.
- **Resale Modeling**: Toggle between full equity recovery (`sellAtEnd = true`) and pure out-of-pocket operational costs (`sellAtEnd = false`).
- **Theme Support**: Seamless 3-state theme switching between **System**, **Light**, and **Dark** modes.

---

## Getting Started

### Prerequisites

Ensure you are using Node.js LTS:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --lts
```

### Development Server

Run the development server on the default frontend port (**8085**):

```bash
PORT=8085 npm run dev -- -p 8085
```

Open [http://localhost:8085](http://localhost:8085) with your browser to access the application.

> **Tip**: To run both the Go backend API and the Next.js frontend concurrently, use `./start.sh` from the repository root.

---

## Component Architecture

```
frontend/
├── app/
│   ├── layout.tsx            # Root layout, font loading, dark theme provider script
│   ├── page.tsx              # Main TCO calculator page and state coordinator
│   └── globals.css           # Global Tailwind CSS and theme variables
├── components/
│   ├── navbar.tsx            # Sticky header with car logo and 3-state theme switcher
│   ├── vehicle-form.tsx      # Comprehensive input form (Cash/Loan/Lease & Powertrains)
│   ├── summary-cards.tsx     # KPI metrics (Total Cost, Monthly, Cost/Mile, Residual)
│   ├── cost-chart.tsx        # Recharts multi-year cumulative cost progression graph
│   ├── schedule-table.tsx    # Year-by-year amortization and expense schedule
│   └── vehicle-table.tsx     # Saved vehicles comparison table with difference indicators
└── vitest.setup.ts           # Vitest DOM environment configuration and matchMedia mock
```

### Key UI Features

1. **Theme Switcher (`navbar.tsx`)**:
   - Offers three options: **System**, **Light**, and **Dark**.
   - Persists user selection in `localStorage` under `tcocalc-theme`.
   - Automatically synchronizes with OS dark mode preferences when set to `system`.

2. **Vehicle Comparison Table (`vehicle-table.tsx`)**:
   - Compare multiple saved vehicle profiles side-by-side.
   - Designate any vehicle as the baseline to view color-coded deltas (cost differences).
   - Switch comparison metric overlays between Total Cost, Annual Average, Monthly Average, Cost Per Mile, and Net Cost.

3. **Optional Resale / Depreciation (`vehicle-form.tsx`)**:
   - Configure whether the vehicle is sold at the conclusion of the ownership horizon.

---

## Available Scripts

From the `frontend/` directory:

```bash
# Start Next.js development server
npm run dev

# Run Vitest unit and component tests
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Run Next.js and ESLint checks
npm run lint

# Build production bundle (static HTML export into `out/`)
npm run build

# Start production server
npm run start
```

---

## Static Export & GitHub Pages Deployment

The frontend runs 100% in the client browser with zero server runtime dependencies. Next.js is configured with `output: "export"` in `next.config.ts`, generating a pure static bundle in `out/`.

### Automated GitHub Pages Workflow

A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`. When pushed to `master` or `main`:

1. It checks out the repository and installs dependencies via `npm ci`.
2. Automatically determines the repository base path (or custom domain) via `actions/configure-pages`.
3. Runs `npm run build` to generate the static site in `frontend/out/`.
4. Deploys the bundle directly to GitHub Pages.

To enable GitHub Pages in your repository:

1. Navigate to **Settings > Pages** on GitHub.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push to `master` or trigger the workflow manually from the **Actions** tab.
