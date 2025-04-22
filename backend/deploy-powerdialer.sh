#!/bin/bash

# PowerDialer Deployment Script für Produktionsserver
# Dieses Skript installiert und konfiguriert den PowerDialer auf einem Produktionsserver

# Farbige Ausgabe für bessere Lesbarkeit
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PowerDialer Produktions-Deployment ===${NC}"
echo -e "${YELLOW}Diese Skript installiert die PowerDialer-Komponenten für die Produktion${NC}"
echo ""

# 1. Prüfen, ob wir im richtigen Verzeichnis sind
if [ ! -f "server.js" ] || [ ! -d "src" ]; then
  echo -e "${RED}Fehler: Dieses Skript muss im Backend-Verzeichnis ausgeführt werden${NC}"
  echo "Bitte wechsle in das Verzeichnis 'backend' und versuche es erneut."
  exit 1
fi

# 2. Redis prüfen/installieren
echo -e "${YELLOW}Prüfe Redis Installation...${NC}"
if command -v redis-cli >/dev/null 2>&1; then
  echo -e "${GREEN}Redis ist bereits installiert.${NC}"
else
  echo -e "${YELLOW}Redis wird installiert...${NC}"
  # Prüfen, welches Paketverwaltungssystem verfügbar ist
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y redis
    sudo systemctl enable redis
    sudo systemctl start redis
  else
    echo -e "${RED}Konnte Redis nicht automatisch installieren.${NC}"
    echo "Bitte installiere Redis manuell und führe dieses Skript erneut aus."
    echo "Installationsanleitung: https://redis.io/download"
    exit 1
  fi
  
  # Prüfen, ob Redis erfolgreich installiert wurde
  if command -v redis-cli >/dev/null 2>&1; then
    echo -e "${GREEN}Redis wurde erfolgreich installiert.${NC}"
  else
    echo -e "${RED}Fehler bei der Redis-Installation.${NC}"
    exit 1
  fi
fi

# 3. Redis-Verbindung testen
echo -e "${YELLOW}Teste Redis-Verbindung...${NC}"
if redis-cli ping | grep -q "PONG"; then
  echo -e "${GREEN}Redis-Verbindung erfolgreich.${NC}"
else
  echo -e "${RED}Redis-Verbindung fehlgeschlagen.${NC}"
  echo "Bitte stelle sicher, dass Redis läuft und erreichbar ist."
  echo "Versuche: sudo systemctl start redis-server"
  exit 1
fi

# 4. Benötigte NPM-Pakete installieren
echo -e "${YELLOW}Installiere notwendige NPM-Pakete...${NC}"
npm install bull redis

# 5. .env.production Datei kopieren, wenn nicht vorhanden
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Erstelle .env aus .env.production...${NC}"
  cp .env.production .env
  echo -e "${GREEN}.env Datei erstellt.${NC}"
  echo -e "${YELLOW}WICHTIG: Bitte aktualisiere die Konfigurationswerte in der .env Datei:${NC}"
  echo "  - AIRCALL_API_KEY und AIRCALL_API_SECRET mit deinen Aircall-Anmeldedaten"
  echo "  - MONGODB_URI mit deiner MongoDB-Verbindungszeichenfolge"
  echo "  - JWT_SECRET mit einem sicheren Schlüssel"
else
  echo -e "${YELLOW}Die .env Datei existiert bereits. PowerDialer-Einstellungen werden hinzugefügt...${NC}"
  
  # Prüfen, ob PowerDialer-Einstellungen bereits in .env vorhanden sind
  if ! grep -q "REDIS_HOST" .env; then
    echo "" >> .env
    echo "# Redis-Konfiguration für PowerDialer" >> .env
    echo "REDIS_HOST=localhost" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "REDIS_PASSWORD=" >> .env
  fi
  
  if ! grep -q "AIRCALL_API_KEY" .env; then
    echo "" >> .env
    echo "# Aircall API Konfiguration" >> .env
    echo "AIRCALL_API_KEY=your_aircall_api_key" >> .env
    echo "AIRCALL_API_SECRET=your_aircall_api_secret" >> .env
  fi
  
  if ! grep -q "ENABLE_MOCK_MODE" .env; then
    echo "" >> .env
    echo "# PowerDialer Einstellungen" >> .env
    echo "ENABLE_MOCK_MODE=false" >> .env
    echo "FORCE_COMPLETE_MOCK=false" >> .env
  fi
  
  if ! grep -q "NODE_ENV=production" .env; then
    echo "" >> .env
    echo "# Server-Umgebung" >> .env
    echo "NODE_ENV=production" >> .env
  fi
  
  echo -e "${GREEN}PowerDialer-Einstellungen zur .env Datei hinzugefügt.${NC}"
  echo -e "${YELLOW}WICHTIG: Bitte aktualisiere die PowerDialer-Konfigurationswerte in der .env Datei.${NC}"
fi

# 6. Prüfen, ob PM2 für Prozessmanagement installiert ist
echo -e "${YELLOW}Prüfe PM2 Installation...${NC}"
if command -v pm2 >/dev/null 2>&1; then
  echo -e "${GREEN}PM2 ist bereits installiert.${NC}"
else
  echo -e "${YELLOW}Installiere PM2 für Prozessmanagement...${NC}"
  npm install -g pm2
  
  if command -v pm2 >/dev/null 2>&1; then
    echo -e "${GREEN}PM2 wurde erfolgreich installiert.${NC}"
  else
    echo -e "${RED}Fehler bei der PM2-Installation.${NC}"
    echo "Bitte installiere PM2 manuell: npm install -g pm2"
  fi
fi

# 7. Erstelle PM2 Ecosystem-Datei für PowerDialer
echo -e "${YELLOW}Erstelle PM2 Ecosystem-Datei...${NC}"
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps : [{
    name: 'scuric-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOL
echo -e "${GREEN}PM2 Ecosystem-Datei erstellt.${NC}"

# 8. Server neustarten
echo -e "${YELLOW}Starte Server mit PM2...${NC}"
if pm2 list | grep -q "scuric-backend"; then
  pm2 restart scuric-backend
else
  pm2 start ecosystem.config.js --env production
fi

# 9. PM2 für automatischen Start bei Systemstart konfigurieren
echo -e "${YELLOW}Konfiguriere PM2 für automatischen Start...${NC}"
pm2 save
echo -e "${YELLOW}Führe den folgenden Befehl aus, um PM2 bei Systemstart zu starten:${NC}"
echo "    pm2 startup"

echo ""
echo -e "${GREEN}=== PowerDialer Deployment abgeschlossen ===${NC}"
echo -e "${YELLOW}Zur Überprüfung der Logs:${NC} pm2 logs scuric-backend"
echo -e "${YELLOW}Zum Neustarten des Servers:${NC} pm2 restart scuric-backend"
echo ""
echo -e "${YELLOW}WICHTIG: Prüfe die .env Datei und stelle sicher, dass alle Konfigurationswerte korrekt sind.${NC}"
echo -e "${YELLOW}         Für echte Anrufe setze ENABLE_MOCK_MODE=false in der .env Datei.${NC}"