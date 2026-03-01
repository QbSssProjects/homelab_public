#!/bin/bash

echo "Uruchamianie frontendu..."
npm start &
FRONT_PID=$!

echo "Uruchamianie backendu..."
cd backend
node server.js &
BACK_PID=$!

# Funkcja zamykająca procesy
cleanup() {
  echo ""
  echo "Zamykanie aplikacji..."
  kill $FRONT_PID 2>/dev/null
  kill $BACK_PID 2>/dev/null
  exit 0
}

# Przechwycenie Ctrl+C
trap cleanup SIGINT

echo "Obie aplikacje działają. Wciśnij Ctrl+C aby je zatrzymać."

# Czekaj na procesy
wait