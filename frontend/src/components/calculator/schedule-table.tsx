"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TCOResult } from "@/lib/tco";

export interface ScheduleTableProps {
  result: TCOResult;
}

export function ScheduleTable({ result }: ScheduleTableProps) {
  let cumulative = 0;
  const chartData = result.yearly.map((row) => {
    cumulative += row.totalOutflow;
    return {
      name: `Yr ${row.year}`,
      year: row.year,
      "Cumulative Spend": Math.round(cumulative),
      "Vehicle Value": Math.round(row.endingVehicleValue),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Progression Schedule</CardTitle>
        <CardDescription>
          Year-by-year trajectory of cumulative spend versus vehicle valuation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progression Chart */}
        <div className="w-full h-64 pt-2" aria-label="Progression Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) =>
                  typeof val === "number" ? `$${val.toLocaleString()}` : String(val ?? "")
                }
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="Cumulative Spend"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Vehicle Value"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Annual Table */}
        <div className="overflow-x-auto">
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
        </div>
      </CardContent>
    </Card>
  );
}
