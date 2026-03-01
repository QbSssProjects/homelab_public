@echo off
echo Uruchamianie frontendu...
start cmd /k "npm start"

echo Uruchamianie backendu...
cd backend
start cmd /k "node server.js"

echo Obie aplikacje powinny działać.