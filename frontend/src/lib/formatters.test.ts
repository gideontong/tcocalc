import { describe, it, expect } from "vitest";
import { formatCurrency, formatCostPerMile, formatNumber } from "./formatters";

describe("Formatting Utilities", () => {
  describe("formatCurrency", () => {
    it("formats standard positive values with cents", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(500)).toBe("$500.00");
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats standard positive values without cents when showCents is false", () => {
      expect(formatCurrency(1234.56, { showCents: false })).toBe("$1,235");
      expect(formatCurrency(7500, { showCents: false })).toBe("$7,500");
      expect(formatCurrency(0, { showCents: false })).toBe("$0");
    });

    it("formats negative currency values cleanly with prefix minus", () => {
      expect(formatCurrency(-2500)).toBe("-$2,500.00");
      expect(formatCurrency(-7500, { showCents: false })).toBe("-$7,500");
      expect(formatCurrency(-0.5)).toBe("-$0.50");
    });

    it("handles compact formatting", () => {
      expect(formatCurrency(12500, { compact: true })).toBe("$12.5K");
      expect(formatCurrency(-50000, { compact: true })).toBe("-$50K");
    });

    it("safely handles non-finite numbers", () => {
      expect(formatCurrency(NaN)).toBe("$0");
      expect(formatCurrency(Infinity)).toBe("$0");
    });
  });

  describe("formatCostPerMile", () => {
    it("formats rates to 3 decimal places with / mi suffix", () => {
      expect(formatCostPerMile(0.694)).toBe("$0.694 / mi");
      expect(formatCostPerMile(0.1)).toBe("$0.100 / mi");
      expect(formatCostPerMile(1.2345)).toBe("$1.235 / mi");
      expect(formatCostPerMile(0)).toBe("$0.000 / mi");
    });

    it("formats negative rates correctly", () => {
      expect(formatCostPerMile(-0.25)).toBe("-$0.250 / mi");
    });

    it("safely handles non-finite numbers", () => {
      expect(formatCostPerMile(NaN)).toBe("$0.000 / mi");
    });
  });

  describe("formatNumber", () => {
    it("formats integers with comma separators", () => {
      expect(formatNumber(12000)).toBe("12,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
      expect(formatNumber(42)).toBe("42");
      expect(formatNumber(0)).toBe("0");
    });

    it("formats with requested fraction digits", () => {
      expect(formatNumber(1234.567, 2)).toBe("1,234.57");
      expect(formatNumber(1234.5, 2)).toBe("1,234.50");
    });

    it("safely handles non-finite numbers", () => {
      expect(formatNumber(NaN)).toBe("0");
    });
  });
});
