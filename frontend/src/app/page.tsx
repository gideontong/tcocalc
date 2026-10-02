"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateTCO, PowertrainType, TCOInput, TCOResult } from "@/lib/tco";

const PRESETS: Record<string, TCOInput> = {
  gas: {
    vehicleName: "2024 Honda Civic",
    powertrain: "gas",
    purchasePrice: 28000,
    downPayment: 5000,
    salesTaxRate: 7.5,
    loanTermMonths: 60,
    loanInterestRate: 5.5,
    ownershipYears: 5,
    annualMileage: 12000,
    fuelEconomyMPG: 33,
    fuelPricePerGal: 3.80,
    efficiencyKWhPer100Mi: 0,
    electricityRatePerKWh: 0,
    annualInsurance: 1400,
    annualMaintenance: 700,
    annualFees: 300,
    depreciationRate: 14.0,
  },
  hybrid: {
    vehicleName: "2024 Toyota RAV4 Hybrid",
    powertrain: "hybrid",
    purchasePrice: 34500,
    downPayment: 6000,
    salesTaxRate: 7.5,
    loanTermMonths: 60,
    loanInterestRate: 5.5,
    ownershipYears: 5,
    annualMileage: 14000,
    fuelEconomyMPG: 39,
    fuelPricePerGal: 3.80,
    efficiencyKWhPer100Mi: 0,
    electricityRatePerKWh: 0,
    annualInsurance: 1550,
    annualMaintenance: 650,
    annualFees: 320,
    depreciationRate: 13.0,
  },
  electric: {
    vehicleName: "2024 Tesla Model 3",
    powertrain: "electric",
    purchasePrice: 38990,
    downPayment: 5000,
    salesTaxRate: 7.5,
    loanTermMonths: 60,
    loanInterestRate: 5.5,
    ownershipYears: 5,
    annualMileage: 12000,
    fuelEconomyMPG: 0,
    fuelPricePerGal: 0,
    efficiencyKWhPer100Mi: 25,
    electricityRatePerKWh: 0.16,
    annualInsurance: 1650,
    annualMaintenance: 450,
    annualFees: 350,
    depreciationRate: 15.0,
  },
};

export default function Home() {
  const [input, setInput] = React.useState<TCOInput>(PRESETS.gas);
  const [result, setResult] = React.useState<TCOResult>(() => calculateTCO(PRESETS.gas));

  const applyPreset = (key: "gas" | "hybrid" | "electric") => {
    const p = PRESETS[key];
    setInput(p);
    setResult(calculateTCO(p));
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = calculateTCO(input);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const updateNumberField = (field: keyof TCOInput, val: string) => {
    const num = parseFloat(val) || 0;
    const nextInput = { ...input, [field]: num };
    setInput(nextInput);
    try {
      setResult(calculateTCO(nextInput));
    } catch {
      // ignore live validation error during partial edit
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <main className="max-w-6xl mx-auto space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            tcocalc
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total Cost of Ownership (TCO) calculator for driving a vehicle across its entire lifecycle.
          </p>
        </header>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Presets:</span>
          <Button variant="outline" size="sm" onClick={() => applyPreset("gas")}>
            Gas Sedan (Civic)
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("hybrid")}>
            Hybrid SUV (RAV4)
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("electric")}>
            Electric EV (Model 3)
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle & Purchase Details</CardTitle>
                <CardDescription>Enter acquisition and baseline vehicle specifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vehicleName">Vehicle Name</Label>
                  <Input
                    id="vehicleName"
                    value={input.vehicleName}
                    onChange={(e) => setInput({ ...input, vehicleName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="powertrain">Powertrain</Label>
                    <select
                      id="powertrain"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={input.powertrain}
                      onChange={(e) => {
                        const pt = e.target.value as PowertrainType;
                        const next = { ...input, powertrain: pt };
                        setInput(next);
                        setResult(calculateTCO(next));
                      }}
                    >
                      <option value="gas">Gas (ICE)</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric (EV)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={input.purchasePrice}
                      onChange={(e) => updateNumberField("purchasePrice", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="downPayment">Down Payment ($)</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={input.downPayment}
                      onChange={(e) => updateNumberField("downPayment", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
                    <Input
                      id="salesTaxRate"
                      type="number"
                      step="0.1"
                      value={input.salesTaxRate}
                      onChange={(e) => updateNumberField("salesTaxRate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loanTermMonths">Loan Term (Months, 0=Cash)</Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      value={input.loanTermMonths}
                      onChange={(e) => updateNumberField("loanTermMonths", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="loanInterestRate">Loan Interest APR (%)</Label>
                    <Input
                      id="loanInterestRate"
                      type="number"
                      step="0.1"
                      value={input.loanInterestRate}
                      onChange={(e) => updateNumberField("loanInterestRate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage & Operating Costs</CardTitle>
                <CardDescription>Mileage, fuel/energy efficiency, and maintenance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownershipYears">Ownership Duration (Years)</Label>
                    <Input
                      id="ownershipYears"
                      type="number"
                      value={input.ownershipYears}
                      onChange={(e) => updateNumberField("ownershipYears", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annualMileage">Annual Mileage (miles/yr)</Label>
                    <Input
                      id="annualMileage"
                      type="number"
                      value={input.annualMileage}
                      onChange={(e) => updateNumberField("annualMileage", e.target.value)}
                    />
                  </div>
                </div>

                {input.powertrain === "electric" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="efficiency">Efficiency (kWh/100mi)</Label>
                      <Input
                        id="efficiency"
                        type="number"
                        step="0.5"
                        value={input.efficiencyKWhPer100Mi}
                        onChange={(e) => updateNumberField("efficiencyKWhPer100Mi", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="electricRate">Electricity Rate ($/kWh)</Label>
                      <Input
                        id="electricRate"
                        type="number"
                        step="0.01"
                        value={input.electricityRatePerKWh}
                        onChange={(e) => updateNumberField("electricityRatePerKWh", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fuelEconomy">Fuel Economy (MPG)</Label>
                      <Input
                        id="fuelEconomy"
                        type="number"
                        value={input.fuelEconomyMPG}
                        onChange={(e) => updateNumberField("fuelEconomyMPG", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fuelPrice">Gas Price ($/gal)</Label>
                      <Input
                        id="fuelPrice"
                        type="number"
                        step="0.05"
                        value={input.fuelPricePerGal}
                        onChange={(e) => updateNumberField("fuelPricePerGal", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance">Annual Insurance ($/yr)</Label>
                    <Input
                      id="insurance"
                      type="number"
                      value={input.annualInsurance}
                      onChange={(e) => updateNumberField("annualInsurance", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance">Annual Maintenance ($/yr)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      value={input.annualMaintenance}
                      onChange={(e) => updateNumberField("annualMaintenance", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fees">Registration & Fees ($/yr)</Label>
                    <Input
                      id="fees"
                      type="number"
                      value={input.annualFees}
                      onChange={(e) => updateNumberField("annualFees", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="depreciation">Depreciation Rate (%/yr)</Label>
                    <Input
                      id="depreciation"
                      type="number"
                      step="0.5"
                      value={input.depreciationRate}
                      onChange={(e) => updateNumberField("depreciationRate", e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={() => handleCalculate()}>
                  Recalculate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output Summary & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Monthly Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${result.monthlyAverageCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs opacity-75 mt-1">per month over {result.input.ownershipYears} years</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cost Per Mile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${result.costPerMile.toFixed(3)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">per driven mile</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Ownership Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${result.netCostOfOwnership.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">after vehicle liquidation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Residual Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${result.residualValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">estimated value after {result.input.ownershipYears} yrs</p>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Category Breakdown</CardTitle>
                <CardDescription>Cumulative expenses by driver across the ownership lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Depreciation", amount: result.categories.depreciation },
                  { label: "Financing Interest", amount: result.categories.financingInterest },
                  { label: "Fuel / Electricity", amount: result.categories.fuelOrEnergy },
                  { label: "Insurance", amount: result.categories.insurance },
                  { label: "Maintenance & Tires", amount: result.categories.maintenance },
                  { label: "Taxes & Registration Fees", amount: result.categories.taxesAndFees },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Year-by-Year Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Annual Progression Schedule</CardTitle>
                <CardDescription>Year-by-year valuation, financing balance, and outflows.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b text-slate-500">
                    <tr>
                      <th className="py-2">Yr</th>
                      <th>Depreciation</th>
                      <th>Loan Pay</th>
                      <th>Energy</th>
                      <th>Insurance</th>
                      <th>Value End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row) => (
                      <tr key={row.year} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="py-2 font-medium">{row.year}</td>
                        <td>${row.depreciationCost.toFixed(2)}</td>
                        <td>${row.loanPayment.toFixed(2)}</td>
                        <td>${row.fuelOrEnergyCost.toFixed(2)}</td>
                        <td>${row.insuranceCost.toFixed(2)}</td>
                        <td className="font-medium">${row.endingVehicleValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
