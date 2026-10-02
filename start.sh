#!/usr/bin/env bash
set -e

# Resolve repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ensure npm is available, running 'nvm use lts' if needed
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found in current environment. Initializing via 'nvm use lts'..."
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    \. "$NVM_DIR/nvm.sh"
  elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
    \. "/usr/local/opt/nvm/nvm.sh"
  elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
    \. "/opt/homebrew/opt/nvm/nvm.sh"
  fi

  if command -v nvm >/dev/null 2>&1; then
    nvm use lts 2>/dev/null || nvm use --lts || true
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm is still not available after 'nvm use lts'. Please install Node.js." >&2
    exit 1
  fi
fi

BACKEND_PORT="${BACKEND_PORT:-9090}"
FRONTEND_PORT="${FRONTEND_PORT:-8080}"

# Function to check whether a port is currently open/in-use
check_port_available() {
  local port="$1"
  local service="$2"
  if lsof -iTCP:"$port" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
    echo "Error: Port $port ($service) is already in use. Please free the port before running start.sh." >&2
    exit 1
  fi
}

echo "=========================================="
echo " Starting tcocalc (Backend + Frontend)"
echo "=========================================="

# Validate port availability before starting
check_port_available "$BACKEND_PORT" "Go backend"
check_port_available "$FRONTEND_PORT" "Next.js frontend"

# Ensure backend server binary exists
mkdir -p "$ROOT_DIR/bin"
if [ ! -f "$ROOT_DIR/bin/server" ]; then
  echo "Building backend API server..."
  (cd "$ROOT_DIR/backend" && go build -o "$ROOT_DIR/bin/server" ./cmd/server)
fi

# Cleanup handler on exit or Ctrl+C
cleanup() {
  echo ""
  echo "Shutting down tcocalc servers..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "All servers stopped."
}
trap cleanup EXIT INT TERM

# Start Backend Server
echo "Starting Go backend server on http://localhost:$BACKEND_PORT ..."
PORT="$BACKEND_PORT" "$ROOT_DIR/bin/server" &
BACKEND_PID=$!

# Start Frontend Dev Server
echo "Starting Next.js frontend dev server on http://localhost:$FRONTEND_PORT ..."
(cd "$ROOT_DIR/frontend" && PORT="$FRONTEND_PORT" npm run dev -- -p "$FRONTEND_PORT") &
FRONTEND_PID=$!

echo ""
echo "Servers are running:"
echo "  • Frontend UI: http://localhost:$FRONTEND_PORT"
echo "  • Backend API: http://localhost:$BACKEND_PORT (Health: http://localhost:$BACKEND_PORT/healthz)"
echo "Press Ctrl+C to stop all servers."
echo ""

# Wait for background processes
wait
