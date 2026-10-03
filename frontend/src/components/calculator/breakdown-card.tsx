import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TCOResult } from "@/lib/tco";

export interface BreakdownCardProps {
  result: TCOResult;
}

export function BreakdownCard({ result }: BreakdownCardProps) {
  const breakdownItems = [
    {
      label: result.acquisition === "lease" ? "Depreciation (Base Lease)" : "Depreciation",
      amount: result.categories.depreciation,
    },
    {
      label: result.acquisition === "lease" ? "Rent Charges (Finance)" : "Financing Interest",
      amount: result.categories.financingInterest,
    },
    { label: "Fuel / Electricity", amount: result.categories.fuelOrEnergy },
    { label: "Insurance", amount: result.categories.insurance },
    { label: "Maintenance & Tires", amount: result.categories.maintenance },
    {
      label: result.acquisition === "lease" ? "Taxes, Fees & Penalties" : "Taxes & Registration Fees",
      amount: result.categories.taxesAndFees,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Category Breakdown</CardTitle>
        <CardDescription>Cumulative expenses by driver across the lifecycle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdownItems.map((item) => (
          <div key={item.label} className="flex justify-between items-center text-sm border-b pb-2">
            <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
