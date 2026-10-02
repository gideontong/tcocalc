.PHONY: all build build-backend build-frontend test test-backend test-frontend lint lint-backend lint-frontend lint-md format

all: build test lint

# --- Build Targets ---
build: build-backend build-frontend

build-backend:
	mkdir -p bin
	cd backend && go build -o ../bin/tcocalc ./cmd/tcocalc
	cd backend && go build -o ../bin/server ./cmd/server

build-frontend:
	cd frontend && npm run build

# --- Test Targets ---
test: test-backend test-frontend

test-backend:
	cd backend && go test -v -race -cover ./...

test-frontend:
	cd frontend && npm test

# --- Lint Targets ---
lint: lint-backend lint-frontend lint-md

lint-backend:
	cd backend && (which golangci-lint >/dev/null 2>&1 && golangci-lint run || go vet ./...)

lint-frontend:
	cd frontend && npm run lint

lint-md:
	npm run format:check

# --- Formatting ---
format:
	npm run format
