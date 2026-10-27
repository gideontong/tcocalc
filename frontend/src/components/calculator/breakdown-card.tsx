import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TCOResult } from "@/lib/tco";
import { formatCurrency } from "@/lib/utils";

export interface BreakdownCardProps {
  result: TCOResult;
}

export function BreakdownCard({ result }: BreakdownCardProps) {
  const showDepreciation = result.acquisition === "lease" || Boolean(result.input.sellAtEnd);
  const breakdownItems = [
    ...(showDepreciation
      ? [
          {
            label: result.acquisition === "lease" ? "Depreciation (Base Lease)" : "Depreciation",
            amount: result.categories.depreciation,
          },
        ]
      : []),
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
        {breakdownItems.map((item) => {
          const isNegative = item.amount < 0;

          return (
            <div key={item.label} className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
              <span
                className={
                  isNegative
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "font-semibold text-slate-900 dark:text-slate-100"
                }
              >
                {formatCurrency(item.amount)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
