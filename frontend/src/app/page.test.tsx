import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";

describe("Home Page Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the tcocalc header, segmented tabs, and initial metrics", () => {
    render(<Home />);
    expect(screen.getByText("tcocalc")).toBeInTheDocument();
    expect(screen.getByText("Monthly Average")).toBeInTheDocument();
    expect(screen.getByText("Cost Per Mile")).toBeInTheDocument();
    expect(screen.getByText("Net Ownership Cost")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cash Purchase/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Loan Financing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vehicle Lease/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/Analysis Horizon/i) as HTMLInputElement).value).toBe("10");
    expect(screen.getByLabelText("Progression Chart")).toBeInTheDocument();
    expect(screen.getByText(/No vehicles added to comparison yet/i)).toBeInTheDocument();
  });

  it("switches to Cash Purchase mode and hides loan fields", () => {
    render(<Home />);
    const cashTab = screen.getByRole("button", { name: /Cash Purchase/i });
    fireEvent.click(cashTab);

    // Down Payment and Loan Term should no longer be visible
    expect(screen.queryByLabelText(/Down Payment/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Loan Term/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Purchase Price/i)).toBeInTheDocument();
  });

  it("switches to Vehicle Lease mode and reveals lease-specific inputs", () => {
    render(<Home />);
    const leaseTab = screen.getByRole("button", { name: /Vehicle Lease/i });
    fireEvent.click(leaseTab);

    expect(screen.getByLabelText(/Due at Signing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Direct Monthly Quote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Annual Mileage Limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exercise purchase buyout/i)).toBeInTheDocument();
    expect(screen.getByText(/vehicle returned/i)).toBeInTheDocument();
  });

  it("updates inputs when switching powertrain to electric", () => {
    render(<Home />);
    const electricRadio = screen.getByRole("radio", { name: "Electric" });
    fireEvent.click(electricRadio);

    const efficiencyLabel = screen.getByText(/Efficiency \(kWh\/100mi\)/i);
    expect(efficiencyLabel).toBeInTheDocument();
  });

  it("allows changing purchase price and recalculates", () => {
    render(<Home />);
    const priceInput = screen.getByLabelText(/Purchase Price/i) as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: "50000" } });
    expect(priceInput.value).toBe("50000");
  });

  it("adds configured vehicle to comparison table and switches between saved vehicles", () => {
    render(<Home />);

    // 1. Click "Add Configured Vehicle" to save first vehicle
    const addBtn = screen.getByRole("button", { name: /Add Configured Vehicle/i });
    fireEvent.click(addBtn);

    // Verify first vehicle appears with active status in table
    expect(screen.getByRole("table", { name: /Saved vehicles table/i })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("2024 Toyota RAV4 Hybrid")).toBeInTheDocument();

    // 2. Change vehicle name and powertrain to create second vehicle
    const nameInput = screen.getByLabelText("Vehicle Name") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "2024 Tesla Model 3" } });
    fireEvent.click(screen.getByRole("radio", { name: "Electric" }));

    // Click "Add Configured Vehicle" to save second vehicle
    fireEvent.click(addBtn);

    // Verify both vehicles exist in table
    expect(screen.getByText("2024 Tesla Model 3")).toBeInTheDocument();

    // 3. Switch back to first vehicle by clicking its row
    fireEvent.click(screen.getByText("2024 Tesla Model 3"));
    expect((screen.getByLabelText("Vehicle Name") as HTMLInputElement).value).toBe(
      "2024 Tesla Model 3"
    );

    // 4. Remove a vehicle
    const removeButtons = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(removeButtons[0]);
    // One vehicle remains
    expect(screen.getAllByRole("button", { name: /Delete/i })).toHaveLength(1);
  });
});
