import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TCOResult } from "@/lib/tco";
import { formatCurrency, formatCostPerMile } from "@/lib/utils";

export interface SummaryCardsProps {
  result: TCOResult;
}

export function SummaryCards({ result }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Monthly Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(result.monthlyAverageCost)}
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
            {formatCostPerMile(result.costPerMile)}
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
            {formatCurrency(result.netCostOfOwnership)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {result.acquisition === "lease"
              ? result.input.lease?.buyoutAtEnd
                ? "after vehicle liquidation"
                : "total lease payments & upkeep"
              : result.input.sellAtEnd
                ? "after vehicle liquidation"
                : "total out-of-pocket & remaining debt"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Residual Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(result.residualValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {result.acquisition === "lease"
              ? result.input.lease?.buyoutAtEnd
                ? `estimated value after ${result.input.ownershipYears} yrs`
                : "vehicle returned ($0 equity)"
              : result.input.sellAtEnd
                ? `estimated value after ${result.input.ownershipYears} yrs`
                : "not selling at end ($0 liquidation)"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
