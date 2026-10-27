import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toBase64,
  fromBase64,
  generateShareableUrl,
  decodeShareableConfig,
  exportToJson,
  exportScheduleToCsv,
} from "./export";
import { DEFAULT_TCO_INPUT } from "./defaults";
import { calculateTCO } from "./tco";

describe("Export and Sharing Utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("encodes and decodes UTF-8 strings accurately", () => {
    const original = "2024 Toyota RAV4 Hybrid™ with Special Char & 123";
    const encoded = toBase64(original);
    const decoded = fromBase64(encoded);
    expect(decoded).toBe(original);
  });

  it("generates a shareable URL containing encoded hash config", () => {
    const url = generateShareableUrl(DEFAULT_TCO_INPUT);
    expect(url).toContain("#config=");

    const hash = url.slice(url.indexOf("#config="));
    const decoded = decodeShareableConfig(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.vehicleName).toBe(DEFAULT_TCO_INPUT.vehicleName);
    expect(decoded?.purchasePrice).toBe(DEFAULT_TCO_INPUT.purchasePrice);
    expect(decoded?.acquisition).toBe(DEFAULT_TCO_INPUT.acquisition);
  });

  it("gracefully returns null for invalid or corrupted hash config", () => {
    expect(decodeShareableConfig("")).toBeNull();
    expect(decodeShareableConfig("#config=")).toBeNull();
    expect(decodeShareableConfig("#config=not-valid-base64!@#")).toBeNull();
    expect(decodeShareableConfig("#config=" + toBase64(JSON.stringify({ foo: "bar" })))).toBeNull();
  });

  describe("File Downloads", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;
    let clickedElement: HTMLAnchorElement | null = null;

    beforeEach(() => {
      clickedElement = null;
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-blob");
      URL.revokeObjectURL = vi.fn();

      appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          clickedElement = node;
          vi.spyOn(node, "click").mockImplementation(() => {});
        }
        return node;
      });

      removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it("triggers JSON export download with formatted structure", () => {
      const calcResult = calculateTCO(DEFAULT_TCO_INPUT);
      exportToJson("test-export.json", {
        activeVehicle: { input: DEFAULT_TCO_INPUT, result: calcResult },
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(clickedElement).not.toBeNull();
      expect(clickedElement?.download).toBe("test-export.json");
      expect(clickedElement?.href).toBe("blob:http://localhost/mock-blob");
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-blob");
    });

    it("triggers CSV schedule download with correct filename and headers", () => {
      const calcResult = calculateTCO(DEFAULT_TCO_INPUT);
      exportScheduleToCsv("test-schedule.csv", calcResult, "2024 Toyota RAV4 Hybrid");

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(clickedElement).not.toBeNull();
      expect(clickedElement?.download).toBe("test-schedule.csv");
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
    });
  });
});
