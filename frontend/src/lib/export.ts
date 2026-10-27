import { TCOInput, TCOResult, SavedVehicle } from "./tco";
import { DEFAULT_TCO_INPUT } from "./defaults";

/**
 * Base64 UTF-8 encoder compatible with browser and Node/Vitest environments.
 */
export function toBase64(str: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return window.btoa(binString);
  }
  return Buffer.from(str, "utf-8").toString("base64");
}

/**
 * Base64 UTF-8 decoder compatible with browser and Node/Vitest environments.
 */
export function fromBase64(b64: string): string {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binString = window.atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

/**
 * Generates a shareable URL containing the encoded vehicle configuration in the hash.
 */
export function generateShareableUrl(input: TCOInput): string {
  const jsonStr = JSON.stringify(input);
  const encoded = toBase64(jsonStr);
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#config=${encoded}`;
  }
  return `#config=${encoded}`;
}

/**
 * Decodes and validates a vehicle configuration from a URL hash or encoded string.
 */
export function decodeShareableConfig(hashOrString: string): TCOInput | null {
  if (!hashOrString) return null;

  try {
    let clean = hashOrString;
    if (clean.includes("#config=")) {
      clean = clean.split("#config=")[1];
    } else if (clean.startsWith("#")) {
      clean = clean.slice(1);
    }

    if (!clean) return null;

    const jsonStr = fromBase64(clean);
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed === "object" && typeof parsed.purchasePrice === "number") {
      return {
        ...DEFAULT_TCO_INPUT,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Failed to decode shareable config", err);
  }

  return null;
}

/**
 * Triggers a client-side file download for the given content.
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url =
    typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(blob)
      : `data:${mimeType},${encodeURIComponent(content)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof URL.revokeObjectURL === "function" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Serializes and triggers download of calculation data as a JSON file.
 */
export function exportToJson(
  filename: string,
  data: {
    activeVehicle: { input: TCOInput; result: TCOResult };
    savedVehicles?: SavedVehicle[];
  }
): void {
  const payload = {
    app: "tcocalc",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const content = JSON.stringify(payload, null, 2);
  triggerFileDownload(filename, content, "application/json");
}

/**
 * Generates and triggers download of the annual schedule as a CSV file.
 */
export function exportScheduleToCsv(
  filename: string,
  result: TCOResult,
  vehicleName: string
): void {
  const headers = [
    "Year",
    "Depreciation ($)",
    "Payment ($)",
    "Fuel or Energy ($)",
    "Insurance ($)",
    "Maintenance ($)",
    "Taxes & Fees ($)",
    "Total Cash Outflow ($)",
    "Ending Vehicle Value ($)",
  ];

  const rows = result.yearly.map((row) => [
    row.year,
    row.depreciationCost.toFixed(2),
    (row.leasePayment ?? row.loanPayment).toFixed(2),
    row.fuelOrEnergyCost.toFixed(2),
    row.insuranceCost.toFixed(2),
    row.maintenanceCost.toFixed(2),
    row.feesCost.toFixed(2),
    row.totalOutflow.toFixed(2),
    row.endingVehicleValue.toFixed(2),
  ]);

  const escapeCell = (val: string | number) => {
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvLines = [
    `# tcocalc Annual Schedule Export - ${vehicleName}`,
    `# Acquisition: ${result.acquisition}`,
    `# Net Cost of Ownership: $${result.netCostOfOwnership.toFixed(2)}`,
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const content = csvLines.join("\n");
  triggerFileDownload(filename, content, "text/csv;charset=utf-8;");
}
