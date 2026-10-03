import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AcquisitionType, PowertrainType, TCOInput } from "@/lib/tco";
import { cn } from "@/lib/utils";

export interface AcquisitionFormProps {
  input: TCOInput;
  onAcquisitionModeChange: (mode: AcquisitionType) => void;
  onVehicleNameChange: (name: string) => void;
  onPowertrainChange: (powertrain: PowertrainType) => void;
  onNumberFieldChange: (field: keyof TCOInput, val: string) => void;
  onLeaseFieldChange: (field: keyof NonNullable<TCOInput["lease"]>, val: string | number | boolean) => void;
}

export function AcquisitionForm({
  input,
  onAcquisitionModeChange,
  onVehicleNameChange,
  onPowertrainChange,
  onNumberFieldChange,
  onLeaseFieldChange,
}: AcquisitionFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <CardTitle>Acquisition & Vehicle Details</CardTitle>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {input.acquisition}
            </span>
          </div>
          <CardDescription>Select acquisition method and customize vehicle pricing.</CardDescription>
        </div>

        {/* Segmented Tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mt-3">
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("cash")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "cash"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Cash Purchase
          </button>
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("loan")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "loan"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Loan Financing
          </button>
          <button
            type="button"
            onClick={() => onAcquisitionModeChange("lease")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              input.acquisition === "lease"
                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Vehicle Lease
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="vehicleName">Vehicle Name</Label>
          <Input
            id="vehicleName"
            value={input.vehicleName}
            onChange={(e) => onVehicleNameChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="powertrain">Powertrain</Label>
            <select
              id="powertrain"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={input.powertrain}
              onChange={(e) => onPowertrainChange(e.target.value as PowertrainType)}
            >
              <option value="gas">Gas (ICE)</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric (EV)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="purchasePrice">
              {input.acquisition === "lease" ? "MSRP / Agreed Price ($)" : "Purchase Price ($)"}
            </Label>
            <Input
              id="purchasePrice"
              type="number"
              value={input.purchasePrice}
              onChange={(e) => onNumberFieldChange("purchasePrice", e.target.value)}
            />
          </div>
        </div>

        {/* Conditional Fields: Cash Mode */}
        {input.acquisition === "cash" && (
          <div>
            <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
            <Input
              id="salesTaxRate"
              type="number"
              step="0.1"
              value={input.salesTaxRate}
              onChange={(e) => onNumberFieldChange("salesTaxRate", e.target.value)}
            />
          </div>
        )}

        {/* Conditional Fields: Loan Mode */}
        {input.acquisition === "loan" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="downPayment">Down Payment ($)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={input.downPayment}
                  onChange={(e) => onNumberFieldChange("downPayment", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
                <Input
                  id="salesTaxRate"
                  type="number"
                  step="0.1"
                  value={input.salesTaxRate}
                  onChange={(e) => onNumberFieldChange("salesTaxRate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanTermMonths">Loan Term (Months)</Label>
                <Input
                  id="loanTermMonths"
                  type="number"
                  value={input.loanTermMonths}
                  onChange={(e) => onNumberFieldChange("loanTermMonths", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loanInterestRate">Loan Interest APR (%)</Label>
                <Input
                  id="loanInterestRate"
                  type="number"
                  step="0.1"
                  value={input.loanInterestRate}
                  onChange={(e) => onNumberFieldChange("loanInterestRate", e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Conditional Fields: Lease Mode */}
        {input.acquisition === "lease" && input.lease && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueAtSigning">Due at Signing ($)</Label>
                <Input
                  id="dueAtSigning"
                  type="number"
                  value={input.lease.dueAtSigning}
                  onChange={(e) => onLeaseFieldChange("dueAtSigning", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="leaseTermMonths">Lease Term (Months)</Label>
                <Input
                  id="leaseTermMonths"
                  type="number"
                  value={input.lease.leaseTermMonths}
                  onChange={(e) => onLeaseFieldChange("leaseTermMonths", parseInt(e.target.value, 10) || 36)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyPayment">Direct Monthly Quote ($)</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  value={input.lease.monthlyPayment}
                  placeholder="e.g. 450"
                  onChange={(e) => onLeaseFieldChange("monthlyPayment", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="salesTaxRate">Monthly Sales Tax (%)</Label>
                <Input
                  id="salesTaxRate"
                  type="number"
                  step="0.1"
                  value={input.salesTaxRate}
                  onChange={(e) => onNumberFieldChange("salesTaxRate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annualMileageLimit">Annual Mileage Limit</Label>
                <Input
                  id="annualMileageLimit"
                  type="number"
                  value={input.lease.annualMileageLimit}
                  onChange={(e) => onLeaseFieldChange("annualMileageLimit", parseFloat(e.target.value) || 12000)}
                />
              </div>
              <div>
                <Label htmlFor="excessMileageFeeRate">Excess Mileage Fee ($/mi)</Label>
                <Input
                  id="excessMileageFeeRate"
                  type="number"
                  step="0.05"
                  value={input.lease.excessMileageFeeRate}
                  onChange={(e) => onLeaseFieldChange("excessMileageFeeRate", parseFloat(e.target.value) || 0.25)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dispositionFee">Disposition Fee ($)</Label>
                <Input
                  id="dispositionFee"
                  type="number"
                  value={input.lease.dispositionFee}
                  onChange={(e) => onLeaseFieldChange("dispositionFee", parseFloat(e.target.value) || 395)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  id="buyoutAtEnd"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={input.lease.buyoutAtEnd}
                  onChange={(e) => onLeaseFieldChange("buyoutAtEnd", e.target.checked)}
                />
                <Label htmlFor="buyoutAtEnd" className="text-xs font-normal">
                  Exercise purchase buyout at lease end
                </Label>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
