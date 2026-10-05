# Documentation and Specifications Index

This directory contains specifications, architectural decision records (ADRs), and implementation plans for the `tcocalc` project.

## File Naming Convention

All specification and planning documents follow the date-prefixed format:

```
docs/specs/YYYY-MM-DD-<title>.md
```

## Specifications & Plans

| File                                                                                         | Status    | Description                                                                                                                                             |
| :------------------------------------------------------------------------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [2026-10-02-initialization.md](2026-10-02-initialization.md)                                 | Completed | Initial project architecture, monorepo structure, Go core engine (backend API + CLI), Next.js frontend with shadcn/ui, testing, and linting guidelines. |
| [2026-10-02-acquisition-modes.md](2026-10-02-acquisition-modes.md)                           | Completed | Specification and plan for toggling acquisition details between Cash Purchase (flat price), Loan Financing (amortization), and Vehicle Lease.           |
| [2026-10-05-multi-vehicle-comparison-table.md](2026-10-05-multi-vehicle-comparison-table.md) | Completed | Specification for saving configured vehicles, managing them in a comparison table, and switching between views with live synchronization.               |

## Updating This Index

Whenever a new specification or plan is created in `docs/specs/`, add an entry to the table above summarizing its purpose and status.
