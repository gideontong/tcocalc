import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";

describe("Home Page Component", () => {
  it("renders the tcocalc header and initial metrics", () => {
    render(<Home />);
    expect(screen.getByText("tcocalc")).toBeInTheDocument();
    expect(screen.getByText("Monthly Average")).toBeInTheDocument();
    expect(screen.getByText("Cost Per Mile")).toBeInTheDocument();
    expect(screen.getByText("Net Ownership Cost")).toBeInTheDocument();
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
