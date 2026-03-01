#!/bin/bash

echo "Uruchamianie frontendu..."
gnome-terminal -- bash -c "npm start; exec bash"

echo "Uruchamianie backendu..."
gnome-terminal -- bash -c "cd backend && node server.js; exec bash"