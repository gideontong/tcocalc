import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { TCOInput } from "@/lib/tco";

export interface UsageFormProps {
  input: TCOInput;
  onNumberFieldChange: (field: keyof TCOInput, val: string) => void;
  onBooleanFieldChange?: (field: keyof TCOInput, val: boolean) => void;
  onCalculate: () => void;
  onReset?: () => void;
}

export function UsageForm({
  input,
  onNumberFieldChange,
  onBooleanFieldChange,
  onCalculate,
  onReset,
}: UsageFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage & Operating Costs</CardTitle>
        <CardDescription>Annual mileage, energy/fuel, insurance, and routine upkeep.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ownershipYears">Analysis Horizon (Years)</Label>
            <NumericInput
              id="ownershipYears"
              min={1}
              max={50}
              integer
              fallback={1}
              disabled={input.acquisition === "lease"}
              value={input.ownershipYears}
              onValueChange={(raw) => onNumberFieldChange("ownershipYears", raw)}
            />
            {input.acquisition === "lease" && (
              <span className="text-[10px] text-muted-foreground">Locked to lease term</span>
            )}
          </div>
          <div>
            <Label htmlFor="annualMileage">Expected Driving (miles/yr)</Label>
            <NumericInput
              id="annualMileage"
              integer
              value={input.annualMileage}
              onValueChange={(raw) => onNumberFieldChange("annualMileage", raw)}
            />
          </div>
        </div>

        {input.powertrain === "electric" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="efficiency">Efficiency (kWh/100mi)</Label>
              <NumericInput
                id="efficiency"
                step="0.5"
                value={input.efficiencyKWhPer100Mi}
                onValueChange={(raw) => onNumberFieldChange("efficiencyKWhPer100Mi", raw)}
              />
            </div>
            <div>
              <Label htmlFor="electricRate">Electricity Rate ($/kWh)</Label>
              <NumericInput
                id="electricRate"
                step="0.01"
                value={input.electricityRatePerKWh}
                onValueChange={(raw) => onNumberFieldChange("electricityRatePerKWh", raw)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuelEconomy">Fuel Economy (MPG)</Label>
              <NumericInput
                id="fuelEconomy"
                value={input.fuelEconomyMPG}
                onValueChange={(raw) => onNumberFieldChange("fuelEconomyMPG", raw)}
              />
            </div>
            <div>
              <Label htmlFor="fuelPrice">Gas Price ($/gal)</Label>
              <NumericInput
                id="fuelPrice"
                step="0.05"
                value={input.fuelPricePerGal}
                onValueChange={(raw) => onNumberFieldChange("fuelPricePerGal", raw)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="insurance">Annual Insurance ($/yr)</Label>
            <NumericInput
              id="insurance"
              value={input.annualInsurance}
              onValueChange={(raw) => onNumberFieldChange("annualInsurance", raw)}
            />
          </div>
          <div>
            <Label htmlFor="maintenance">Annual Maintenance ($/yr)</Label>
            <NumericInput
              id="maintenance"
              value={input.annualMaintenance}
              onValueChange={(raw) => onNumberFieldChange("annualMaintenance", raw)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fees">Registration & Fees ($/yr)</Label>
            <NumericInput
              id="fees"
              value={input.annualFees}
              onValueChange={(raw) => onNumberFieldChange("annualFees", raw)}
            />
          </div>
          {input.acquisition !== "lease" && (
            <div className="flex items-center space-x-2 pt-6">
              <input
                id="sellAtEnd"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={Boolean(input.sellAtEnd)}
                onChange={(e) => onBooleanFieldChange?.("sellAtEnd", e.target.checked)}
              />
              <Label htmlFor="sellAtEnd" className="text-xs font-normal">
                Sell vehicle at end of horizon
              </Label>
            </div>
          )}
        </div>

        {input.acquisition !== "lease" && Boolean(input.sellAtEnd) && (
          <div>
            <Label htmlFor="depreciation">Depreciation Rate (%/yr)</Label>
            <NumericInput
              id="depreciation"
              step="0.5"
              value={input.depreciationRate}
              onValueChange={(raw) => onNumberFieldChange("depreciationRate", raw)}
            />
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={onCalculate}>
            Recalculate
          </Button>
          {onReset && (
            <Button type="button" variant="outline" onClick={onReset}>
              Reset Defaults
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
