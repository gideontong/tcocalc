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
import { SavedVehicle, TCOResult, VEHICLE_PALETTE } from "@/lib/tco";
import { cn, formatCurrency } from "@/lib/utils";

export interface ScheduleTableProps {
  result: TCOResult;
  comparedVehicles?: SavedVehicle[];
}

export function ScheduleTable({ result, comparedVehicles }: ScheduleTableProps) {
  const [comparisonMetric, setComparisonMetric] = React.useState<"spend" | "value">("spend");

  const isMultiVehicle = (comparedVehicles?.length ?? 0) > 1;
  const showDepreciation = result.acquisition === "lease" || Boolean(result.input.sellAtEnd);
  const showValuation =
    result.acquisition === "lease"
      ? Boolean(result.input.lease?.buyoutAtEnd)
      : Boolean(result.input.sellAtEnd);

  // Single-vehicle chart data
  let cumulative = 0;
  const singleChartData = result.yearly.map((row) => {
    cumulative += row.totalOutflow;
    return {
      name: `Yr ${row.year}`,
      year: row.year,
      "Cumulative Spend": Math.round(cumulative),
      ...(showValuation ? { "Vehicle Value": Math.round(row.endingVehicleValue) } : {}),
    };
  });

  // Multi-vehicle chart data
  const multiChartData = React.useMemo(() => {
    if (!isMultiVehicle || !comparedVehicles) return [];

    const maxYears = Math.max(...comparedVehicles.map((v) => v.input.ownershipYears), 1);
    const data = [];

    for (let y = 1; y <= maxYears; y++) {
      const point: Record<string, string | number> = {
        name: `Yr ${y}`,
        year: y,
      };

      for (const v of comparedVehicles) {
        if (y <= v.input.ownershipYears) {
          if (comparisonMetric === "spend") {
            let cumSpend = 0;
            for (let i = 0; i < y; i++) {
              cumSpend += v.result.yearly[i]?.totalOutflow ?? 0;
            }
            point[v.id] = Math.round(cumSpend);
          } else {
            const yearItem = v.result.yearly[y - 1];
            point[v.id] = Math.round(yearItem?.endingVehicleValue ?? 0);
          }
        }
      }
      data.push(point);
    }

    return data;
  }, [isMultiVehicle, comparedVehicles, comparisonMetric]);

  const activeChartData = isMultiVehicle ? multiChartData : singleChartData;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Annual Progression Schedule</CardTitle>
            <CardDescription className="mt-1">
              {isMultiVehicle
                ? comparisonMetric === "spend"
                  ? "Multi-vehicle comparison of cumulative cash outflow trajectories."
                  : "Multi-vehicle comparison of vehicle asset valuations over time."
                : showValuation
                  ? "Year-by-year trajectory of cumulative spend versus vehicle valuation."
                  : "Year-by-year trajectory of cumulative ownership spend."}
            </CardDescription>
          </div>
          {isMultiVehicle && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setComparisonMetric("spend")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                  comparisonMetric === "spend"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                Cumulative Spend
              </button>
              <button
                type="button"
                onClick={() => setComparisonMetric("value")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                  comparisonMetric === "value"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                Vehicle Value
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progression Chart */}
        <div className="w-full h-64 pt-2" aria-label="Progression Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) =>
                  typeof val === "number" ? formatCurrency(val, { showCents: false }) : String(val ?? "")
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
              {isMultiVehicle ? (
                comparedVehicles!.map((v, index) => (
                  <Line
                    key={v.id}
                    type="monotone"
                    dataKey={v.id}
                    name={v.input.vehicleName || `Vehicle ${index + 1}`}
                    stroke={VEHICLE_PALETTE[index % VEHICLE_PALETTE.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ))
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="Cumulative Spend"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {showValuation && (
                    <Line
                      type="monotone"
                      dataKey="Vehicle Value"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Annual Table */}
        <div className="space-y-2">
          {isMultiVehicle && (
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Detailed Annual Breakdown: {result.input.vehicleName || "Active Vehicle"}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2">Yr</th>
                  {showDepreciation && <th>Depreciation</th>}
                  <th>{result.acquisition === "lease" ? "Lease Pay" : "Loan Pay"}</th>
                  <th>Energy</th>
                  <th>Insurance</th>
                  {showValuation && <th>Value End</th>}
                </tr>
              </thead>
              <tbody>
                {result.yearly.map((row) => (
                  <tr key={row.year} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="py-2 font-medium">{row.year}</td>
                    {showDepreciation && <td>{formatCurrency(row.depreciationCost)}</td>}
                    <td>{formatCurrency(row.leasePayment ?? row.loanPayment)}</td>
                    <td>{formatCurrency(row.fuelOrEnergyCost)}</td>
                    <td>{formatCurrency(row.insuranceCost)}</td>
                    {showValuation && (
                      <td className="font-medium">{formatCurrency(row.endingVehicleValue)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
