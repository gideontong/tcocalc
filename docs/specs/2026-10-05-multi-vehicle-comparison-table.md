# Specification: Multi-Vehicle Comparison and Saved Vehicles Table

## Context & Motivation

To help car shoppers and fleet managers make informed financial decisions, `tcocalc` needs to support comparing multiple vehicles side-by-side. Currently, the application allows in-depth calculation and visualization of a single vehicle's lifecycle costs.

As the foundational step toward full multi-vehicle comparison, this feature introduces a **Saved Vehicles Table** that enables users to:

1. Configure vehicle parameters in the calculator.
2. Save/add configured vehicles into a persistent comparison table.
3. Switch between saved vehicle views with real-time live synchronization.
4. Remove vehicles from comparison as needed.

---

## Architectural Decisions

### 1. Data Model (`SavedVehicle`)

A saved vehicle snapshot encapsulates its unique identifier, input parameters, computed result, and timestamp:

```typescript
export interface SavedVehicle {
  id: string;
  input: TCOInput;
  result: TCOResult;
  createdAt: number;
}
```

### 2. State & Live Synchronization

- **Coordinator (`frontend/src/app/page.tsx`)**:
  - Maintains `vehicles: SavedVehicle[]` and `selectedId: string | null`.
  - When a saved vehicle is active (`selectedId !== null`), modifications to form inputs update that vehicle in real time, keeping the table summary and calculator views synchronized.
  - Clicking **"Add Configured Vehicle"** captures the current form parameters as a new `SavedVehicle` entry and activates it.
  - Deleting the active vehicle automatically switches active selection to the next available entry, or reverts `selectedId` to `null` if the table is emptied.

### 3. LocalStorage Persistence

- Saved vehicles are persisted under the key `tcocalc_saved_vehicles`.
- To prevent Next.js server-side hydration mismatches, vehicles are loaded on client mount via a `useEffect` hook.

### 4. Component Layout

- **Placement**: A new `VehicleTable` card is placed at the top of the page (below the header and above the 2-column calculator layout).
- **Empty State**: When no vehicles are saved, displays an informative prompt inviting the user to configure and save their first vehicle.
- **Table Columns**:
  - Active selection indicator
  - Vehicle Name
  - Powertrain (_Gas_, _Hybrid_, _Electric_)
  - Acquisition (_Cash_, _Loan_, _Lease_)
  - Monthly Average Cost (`$X.XX/mo`)
  - Net Ownership Cost (`$XX,XXX`)
  - Actions (Remove vehicle)

---

## Component Interface Contracts

### `VehicleTable` (`frontend/src/components/calculator/vehicle-table.tsx`)

```typescript
export interface VehicleTableProps {
  vehicles: SavedVehicle[];
  selectedId: string | null;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  onDeleteVehicle: (id: string) => void;
}
```

---

## Testing & Quality Criteria

1. **Unit & Integration Tests**:
   - `VehicleTable` renders empty state prompt when no vehicles exist.
   - `VehicleTable` renders saved vehicle rows with formatted costs.
   - Selecting a row triggers `onSelectVehicle` and updates the active row highlight.
   - Clicking Add triggers `onAddVehicle`.
   - Clicking Delete triggers `onDeleteVehicle` without triggering selection.
   - `page.test.tsx` verifies end-to-end adding, live syncing, switching, and deleting vehicles.
2. **ESLint & TypeScript**: Zero linter warnings or TypeScript errors (`make lint`).
3. **Automated Verification**: Clean production build (`npm run build`) and passing tests (`make test`).
