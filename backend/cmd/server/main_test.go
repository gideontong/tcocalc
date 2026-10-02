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

func TestCalculateEndpoint(t *testing.T) {
	input := tco.TCOInput{
		VehicleName:     "Test Car",
		Powertrain:      tco.PowertrainGas,
		PurchasePrice:   30000,
		DownPayment:     5000,
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

	if res.Input.VehicleName != "Test Car" {
		t.Errorf("expected vehicle name 'Test Car', got %s", res.Input.VehicleName)
	}
}
