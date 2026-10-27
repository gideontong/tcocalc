/**
 * Standard financial and numeric formatting utilities for tcocalc.
 */

export interface FormatCurrencyOptions {
  showCents?: boolean;
  compact?: boolean;
}

/**
 * Formats a numeric value into a USD currency string.
 * Handles negative values cleanly (e.g. `-$1,250.00` rather than `$-1,250.00`).
 */
export function formatCurrency(
  val: number,
  options: FormatCurrencyOptions = {}
): string {
  if (!isFinite(val)) return "$0";

  const { showCents = true, compact = false } = options;
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  if (compact) {
    const formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(absVal);
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  }

  const fractionDigits = showCents ? 2 : 0;
  const formatted = absVal.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Formats a cost-per-mile rate to 3 decimal places with standard suffix (e.g. `$0.694 / mi`).
 */
export function formatCostPerMile(val: number): string {
  if (!isFinite(val)) return "$0.000 / mi";

  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return isNegative ? `-$${formatted} / mi` : `$${formatted} / mi`;
}

/**
 * Formats a generic numeric value with comma thousands separators.
 */
export function formatNumber(val: number, fractionDigits = 0): string {
  if (!isFinite(val)) return "0";

  return val.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
