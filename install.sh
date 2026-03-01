#!/bin/bash

set -e

echo "=================================="
echo "   DEVOPS INSTALLER START"
echo "=================================="

# ---- KOLORY ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ---- NVM ----
if [ ! -d "$HOME/.nvm" ]; then
  echo -e "${YELLOW}Instalowanie NVM...${NC}"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

# ---- NODE ----
echo -e "${YELLOW}Instalowanie Node 20 LTS...${NC}"
nvm install 20
nvm use 20
nvm alias default 20

echo -e "${GREEN}Node version: $(node -v)${NC}"
echo -e "${GREEN}NPM version: $(npm -v)${NC}"

# ---- STRUKTURA ----
echo -e "${YELLOW}Tworzenie struktury katalogów...${NC}"
mkdir -p backend/uploaded_documents

# ---- .env ----
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Tworzenie .env...${NC}"
  cat <<EOL > .env
HOST=0.0.0.0
PORT=3000
REACT_APP_API_URL=http://localhost:3001
EOL
else
  echo -e "${GREEN}.env już istnieje${NC}"
fi

# ---- package.json FRONT ----
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}Tworzenie package.json (frontend)...${NC}"
  npm init -y
fi

# ---- FRONTEND INSTALL ----
echo -e "${YELLOW}Instalowanie zależności frontend...${NC}"

npm install \
@tailwindcss/vite@4.1.16 \
@testing-library/dom@10.4.1 \
@testing-library/jest-dom@6.9.1 \
@testing-library/react@16.3.0 \
@testing-library/user-event@13.5.0 \
autoprefixer@10.4.21 \
firebase@12.4.0 \
jsbarcode@3.12.1 \
jspdf-autotable@5.0.2 \
jspdf@3.0.3 \
postcss@8.5.6 \
react-dom@19.2.0 \
react-hot-toast@2.6.0 \
react-scripts@5.0.1 \
react@19.2.0 \
recharts@3.3.0 \
tailwindcss@3.4.18 \
web-vitals@2.1.4

# ---- BACKEND ----
cd backend

if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}Tworzenie package.json (backend)...${NC}"
  npm init -y
fi

echo -e "${YELLOW}Instalowanie zależności backend...${NC}"

npm install \
cors@2.8.5 \
express@5.1.0 \
firebase-admin@13.6.0 \
multer@2.0.2 \
serve-index@1.9.1

cd ..

# ---- START SCRIPT ----
echo -e "${YELLOW}Generowanie start.sh...${NC}"

cat <<'EOL' > start.sh
#!/bin/bash

echo "Uruchamianie frontendu..."
npm start &
FRONT_PID=$!

echo "Uruchamianie backendu..."
cd backend
node server.js &
BACK_PID=$!

cleanup() {
  echo ""
  echo "Zamykanie aplikacji..."
  kill $FRONT_PID 2>/dev/null
  kill $BACK_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT

echo "Aplikacje działają. Ctrl+C aby zatrzymać."
wait
EOL

chmod +x start.sh

echo -e "${GREEN}"
echo "=================================="
echo " INSTALACJA ZAKOŃCZONA"
echo "=================================="
echo "Uruchom aplikację:"
echo "./start.sh"
echo -e "${NC}"