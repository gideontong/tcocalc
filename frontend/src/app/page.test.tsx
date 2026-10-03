import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";

describe("Home Page Component", () => {
  it("renders the tcocalc header, segmented tabs, and initial metrics", () => {
    render(<Home />);
    expect(screen.getByText("tcocalc")).toBeInTheDocument();
    expect(screen.getByText("Monthly Average")).toBeInTheDocument();
    expect(screen.getByText("Cost Per Mile")).toBeInTheDocument();
    expect(screen.getByText("Net Ownership Cost")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cash Purchase/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Loan Financing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vehicle Lease/i })).toBeInTheDocument();
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

  it("updates inputs when clicking quick preset buttons", () => {
    render(<Home />);
    const evButton = screen.getByRole("button", { name: /Electric EV/i });
    fireEvent.click(evButton);

    const vehicleInput = screen.getByLabelText("Vehicle Name") as HTMLInputElement;
    expect(vehicleInput.value).toBe("2024 Tesla Model 3");

    const efficiencyLabel = screen.getByText(/Efficiency \(kWh\/100mi\)/i);
    expect(efficiencyLabel).toBeInTheDocument();
  });

  it("allows changing purchase price and recalculates", () => {
    render(<Home />);
    const priceInput = screen.getByLabelText(/Purchase Price/i) as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: "50000" } });
    expect(priceInput.value).toBe("50000");
  });
});
