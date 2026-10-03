import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TCOResult } from "@/lib/tco";

export interface ScheduleTableProps {
  result: TCOResult;
}

export function ScheduleTable({ result }: ScheduleTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Progression Schedule</CardTitle>
        <CardDescription>Year-by-year valuation, payments, and outflows.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b text-slate-500">
            <tr>
              <th className="py-2">Yr</th>
              <th>Depreciation</th>
              <th>{result.acquisition === "lease" ? "Lease Pay" : "Loan Pay"}</th>
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
                <td>${(row.leasePayment ?? row.loanPayment).toFixed(2)}</td>
                <td>${row.fuelOrEnergyCost.toFixed(2)}</td>
                <td>${row.insuranceCost.toFixed(2)}</td>
                <td className="font-medium">${row.endingVehicleValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
