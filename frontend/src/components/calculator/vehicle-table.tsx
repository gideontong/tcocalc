import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedVehicle } from "@/lib/tco";
import { cn } from "@/lib/utils";

export interface VehicleTableProps {
  vehicles: SavedVehicle[];
  selectedId: string | null;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  onDeleteVehicle: (id: string) => void;
}

export function VehicleTable({
  vehicles,
  selectedId,
  onSelectVehicle,
  onAddVehicle,
  onDeleteVehicle,
}: VehicleTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Saved Vehicles</CardTitle>
            <CardDescription className="mt-1">
              Manage, compare, and switch between saved vehicle configurations.
            </CardDescription>
          </div>
          <Button size="sm" onClick={onAddVehicle} className="shrink-0">
            Add Configured Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-sm font-medium">No vehicles added to comparison yet.</p>
            <p className="text-xs mt-1">
              Customize the vehicle details below and click &quot;Add Configured Vehicle&quot; to save it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Saved vehicles table">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Vehicle Name</th>
                  <th className="py-2.5 px-3">Powertrain</th>
                  <th className="py-2.5 px-3">Acquisition</th>
                  <th className="py-2.5 px-3">Monthly Cost</th>
                  <th className="py-2.5 px-3">Net Ownership Cost</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const isSelected = v.id === selectedId;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => onSelectVehicle(v.id)}
                      className={cn(
                        "border-b last:border-0 cursor-pointer transition-colors",
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-800/80 font-medium"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                      )}
                    >
                      <td className="py-2.5 px-3">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground">
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">Select</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {v.input.vehicleName || "Untitled Vehicle"}
                      </td>
                      <td className="py-2.5 px-3 capitalize">{v.input.powertrain}</td>
                      <td className="py-2.5 px-3 capitalize">{v.input.acquisition}</td>
                      <td className="py-2.5 px-3">
                        ${v.result.monthlyAverageCost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        /mo
                      </td>
                      <td className="py-2.5 px-3">
                        ${v.result.netCostOfOwnership.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteVehicle(v.id);
                          }}
                          aria-label={`Delete ${v.input.vehicleName || "vehicle"}`}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
