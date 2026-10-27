"use client";

import * as React from "react";
import { useTCOCalculator } from "@/hooks/use-tco-calculator";
import {
  AcquisitionForm,
  IncentivesForm,
  UsageForm,
  SummaryCards,
  BreakdownCard,
  ScheduleTable,
  VehicleTable,
  Navbar,
} from "@/components/calculator";

export default function Home() {
  const { state, actions } = useTCOCalculator();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Saved Vehicles Comparison Table */}
        <VehicleTable
          vehicles={state.vehicles}
          selectedId={state.selectedId}
          comparedIds={state.comparedIds}
          onSelectVehicle={actions.selectVehicle}
          onAddVehicle={actions.addVehicle}
          onDeleteVehicle={actions.deleteVehicle}
          onToggleCompare={actions.toggleCompare}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 space-y-6">
            <AcquisitionForm
              input={state.input}
              onAcquisitionModeChange={actions.setAcquisitionMode}
              onVehicleNameChange={actions.updateVehicleName}
              onPowertrainChange={actions.updatePowertrain}
              onNumberFieldChange={actions.updateNumberField}
              onLeaseFieldChange={actions.updateLeaseField}
            />

            <IncentivesForm
              input={state.input}
              onNumberFieldChange={actions.updateNumberField}
              onTimingChange={actions.updateTiming}
            />

            <UsageForm
              input={state.input}
              onNumberFieldChange={actions.updateNumberField}
              onBooleanFieldChange={actions.updateBooleanField}
              onCalculate={actions.calculate}
            />
          </div>

          {/* Right Column: Output Summary & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <SummaryCards result={state.result} />
            <BreakdownCard result={state.result} />
            <ScheduleTable
              result={state.result}
              comparedVehicles={state.vehicles.filter((v) => state.comparedIds.includes(v.id))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
