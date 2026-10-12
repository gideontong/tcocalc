import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TCOInput } from "@/lib/tco";

export interface UsageFormProps {
  input: TCOInput;
  onNumberFieldChange: (field: keyof TCOInput, val: string) => void;
  onBooleanFieldChange?: (field: keyof TCOInput, val: boolean) => void;
  onCalculate: () => void;
}

export function UsageForm({
  input,
  onNumberFieldChange,
  onBooleanFieldChange,
  onCalculate,
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
            <Input
              id="ownershipYears"
              type="number"
              disabled={input.acquisition === "lease"}
              value={input.ownershipYears}
              onChange={(e) => onNumberFieldChange("ownershipYears", e.target.value)}
            />
            {input.acquisition === "lease" && (
              <span className="text-[10px] text-muted-foreground">Locked to lease term</span>
            )}
          </div>
          <div>
            <Label htmlFor="annualMileage">Expected Driving (miles/yr)</Label>
            <Input
              id="annualMileage"
              type="number"
              value={input.annualMileage}
              onChange={(e) => onNumberFieldChange("annualMileage", e.target.value)}
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
                onChange={(e) => onNumberFieldChange("efficiencyKWhPer100Mi", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="electricRate">Electricity Rate ($/kWh)</Label>
              <Input
                id="electricRate"
                type="number"
                step="0.01"
                value={input.electricityRatePerKWh}
                onChange={(e) => onNumberFieldChange("electricityRatePerKWh", e.target.value)}
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
                onChange={(e) => onNumberFieldChange("fuelEconomyMPG", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fuelPrice">Gas Price ($/gal)</Label>
              <Input
                id="fuelPrice"
                type="number"
                step="0.05"
                value={input.fuelPricePerGal}
                onChange={(e) => onNumberFieldChange("fuelPricePerGal", e.target.value)}
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
              onChange={(e) => onNumberFieldChange("annualInsurance", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maintenance">Annual Maintenance ($/yr)</Label>
            <Input
              id="maintenance"
              type="number"
              value={input.annualMaintenance}
              onChange={(e) => onNumberFieldChange("annualMaintenance", e.target.value)}
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
              onChange={(e) => onNumberFieldChange("annualFees", e.target.value)}
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
            <Input
              id="depreciation"
              type="number"
              step="0.5"
              value={input.depreciationRate}
              onChange={(e) => onNumberFieldChange("depreciationRate", e.target.value)}
            />
          </div>
        )}

        <Button className="w-full mt-4" onClick={onCalculate}>
          Recalculate
        </Button>
      </CardContent>
    </Card>
  );
}
