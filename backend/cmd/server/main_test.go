package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gideontong/tcocalc/backend/pkg/tco"
)

func TestHealthz(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rr := httptest.NewRecorder()

	handleHealthz(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
}

func TestCalculateEndpointLoan(t *testing.T) {
	input := tco.TCOInput{
		VehicleName:     "Test Loan Car",
		Powertrain:      tco.PowertrainGas,
		Acquisition:     tco.AcquisitionLoan,
		PurchasePrice:   30000,
		DownPayment:     5000,
		LoanTermMonths:  60,
		OwnershipYears:  5,
		AnnualMileage:   10000,
		FuelEconomyMPG:  30,
		FuelPricePerGal: 3.50,
	}

	body, err := json.Marshal(input)
	if err != nil {
		t.Fatalf("failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	handleCalculate(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var res tco.TCOResult
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.Input.VehicleName != "Test Loan Car" {
		t.Errorf("expected vehicle name 'Test Loan Car', got %s", res.Input.VehicleName)
	}
	if res.Acquisition != tco.AcquisitionLoan {
		t.Errorf("expected acquisition 'loan', got %s", res.Acquisition)
	}
}

func TestCalculateEndpointCash(t *testing.T) {
	input := tco.TCOInput{
		VehicleName:     "Test Cash Car",
		Powertrain:      tco.PowertrainGas,
		Acquisition:     tco.AcquisitionCash,
		PurchasePrice:   25000,
		OwnershipYears:  3,
		AnnualMileage:   10000,
		FuelEconomyMPG:  30,
		FuelPricePerGal: 3.50,
	}

	body, err := json.Marshal(input)
	if err != nil {
		t.Fatalf("failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	handleCalculate(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var res tco.TCOResult
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.Acquisition != tco.AcquisitionCash {
		t.Errorf("expected acquisition 'cash', got %s", res.Acquisition)
	}
	if res.Categories.FinancingInterest != 0 {
		t.Errorf("expected 0 interest for cash, got %f", res.Categories.FinancingInterest)
	}
}

func TestCalculateEndpointLease(t *testing.T) {
	input := tco.TCOInput{
		VehicleName:     "Test Lease Car",
		Powertrain:      tco.PowertrainGas,
		Acquisition:     tco.AcquisitionLease,
		PurchasePrice:   40000,
		AnnualMileage:   12000,
		FuelEconomyMPG:  30,
		FuelPricePerGal: 3.50,
		Lease: &tco.LeaseInput{
			LeaseTermMonths: 36,
			DueAtSigning:    3000,
			MonthlyPayment:  450,
			DispositionFee:  395,
		},
	}

	body, err := json.Marshal(input)
	if err != nil {
		t.Fatalf("failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	handleCalculate(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var res tco.TCOResult
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.Acquisition != tco.AcquisitionLease {
		t.Errorf("expected acquisition 'lease', got %s", res.Acquisition)
	}
	if res.ResidualValue != 0 {
		t.Errorf("expected 0 residual value for returned lease, got %f", res.ResidualValue)
	}
}
