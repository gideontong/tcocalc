"use client";

import * as React from "react";
import { Input } from "./input";

export interface NumericInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: number | undefined;
  onValueChange: (rawValue: string, numericValue: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  fallback?: number;
}

/**
 * Number input that preserves intermediate editing states (such as clearing
 * the field or typing decimals) while live-syncing valid numeric values and
 * restoring a clamped fallback on blur if left empty.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      onValueChange,
      min = 0,
      max,
      integer = false,
      fallback = 0,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(() =>
      value === undefined ? "" : String(value)
    );
    const [prevValue, setPrevValue] = React.useState<number | undefined>(value);

    const clamp = React.useCallback(
      (num: number): number => {
        let next = integer ? Math.round(num) : num;
        if (min !== undefined && next < min) next = min;
        if (max !== undefined && next > max) next = max;
        return next;
      },
      [integer, min, max]
    );

    const parseInput = React.useCallback(
      (raw: string): { parsedRaw: number; clamped: number } | null => {
        const trimmed = raw.trim();
        if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
          return null;
        }
        const parsedRaw = Number(trimmed);
        if (!Number.isFinite(parsedRaw)) {
          return null;
        }
        return { parsedRaw, clamped: clamp(parsedRaw) };
      },
      [clamp]
    );

    // Sync local draft when the parent prop changes externally (e.g. preset, vehicle switch, reset).
    if (value !== prevValue) {
      setPrevValue(value);
      const parsed = parseInput(draft);
      if ((parsed?.clamped ?? null) !== value) {
        setIsEditing(false);
        setDraft(value === undefined ? "" : String(value));
      }
    }

    const displayedValue = isEditing ? draft : value === undefined ? "" : String(value);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(true);
      setDraft(value === undefined ? "" : String(value));
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setIsEditing(true);

      const parsed = parseInput(raw);
      if (parsed === null) {
        setDraft(raw);
        return;
      }

      const { parsedRaw, clamped } = parsed;
      const nextRaw = clamped !== parsedRaw ? String(clamped) : raw;

      setDraft(nextRaw);
      onValueChange(nextRaw, clamped);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInput(draft);
      if (parsed === null) {
        const committed = clamp(fallback);
        setDraft(String(committed));
        onValueChange(String(committed), committed);
      } else {
        const { clamped } = parsed;
        setDraft(String(clamped));
        if (clamped !== value) {
          onValueChange(String(clamped), clamped);
        }
      }
      setIsEditing(false);
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="number"
        min={min}
        max={max}
        value={displayedValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";
