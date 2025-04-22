# PowerDialer Server-Installation

Diese Anleitung beschreibt, wie der neue PowerDialer auf einem Produktionsserver installiert wird.

## Voraussetzungen

- Linux-Server (Ubuntu/Debian empfohlen)
- Node.js (Version 18 oder höher)
- npm (normalerweise mit Node.js installiert)
- Git
- MongoDB (kann lokal oder als Cloud-Service verwendet werden)
- Gültige Aircall API-Anmeldedaten für echte Anrufe

## Installations-Schritte

### 1. Code auf den Server übertragen

```bash
# Klonen Sie das Repository oder laden Sie es auf den Server hoch
git clone <repository-url>
cd Dashboard-Backoffice
```

### 2. Backend einrichten

```bash
# Wechseln ins Backend-Verzeichnis
cd backend

# Führen Sie das Deployment-Skript aus
./deploy-powerdialer.sh
```

Das Skript führt automatisch die folgenden Schritte aus:

1. Prüft/installiert Redis (erforderlich für die Auftragsverarbeitung)
2. Installiert erforderliche NPM-Pakete (bull, redis)
3. Erstellt die .env-Datei mit Produktionskonfiguration
4. Installiert PM2 für Prozessverwaltung
5. Startet den Server mit PM2

### 3. Umgebungsvariablen konfigurieren

Bearbeiten Sie die `.env`-Datei und aktualisieren Sie folgende Werte:

```bash
# Bearbeiten Sie die .env-Datei
nano .env
```

Wichtige Werte, die gesetzt werden müssen:

```
# MongoDB-Verbindung
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scuric-dashboard

# Aircall API-Anmeldedaten
AIRCALL_API_KEY=your_aircall_api_key
AIRCALL_API_SECRET=your_aircall_api_secret

# PowerDialer Modus - für echte Anrufe auf 'false' setzen
ENABLE_MOCK_MODE=false
FORCE_COMPLETE_MOCK=false

# JWT-Secret für Authentifizierung
JWT_SECRET=your_secure_jwt_secret

# CORS-Einstellungen entsprechend Ihrer Frontend-Domain
CORS_ORIGIN=https://your-domain.com
```

### 4. Server starten/neustarten

Nach der Konfiguration:

```bash
# Server neustarten
pm2 restart scuric-backend

# Status prüfen
pm2 status

# Logs ansehen
pm2 logs scuric-backend
```

## Fehlersuche

### Redis-Verbindungsprobleme

Wenn Redis Verbindungsprobleme meldet:

```bash
# Prüfen, ob Redis läuft
sudo systemctl status redis-server

# Starten, wenn nicht aktiv
sudo systemctl start redis-server

# Redis Command Line Interface testen
redis-cli ping  # Sollte "PONG" zurückgeben
```

### MongoDB-Verbindungsprobleme

Wenn die MongoDB-Verbindung fehlschlägt:

1. Überprüfen Sie die MONGODB_URI in der .env-Datei
2. Prüfen Sie Netzwerkverbindung/Firewall-Einstellungen
3. Überprüfen Sie die Logs mit `pm2 logs scuric-backend`

### Aircall-API-Probleme

Wenn die Aircall-API-Verbindung fehlschlägt:

1. Überprüfen Sie die API-Anmeldedaten in der .env-Datei
2. Prüfen Sie, ob Ihre Aircall-API-Keys aktiv sind
3. Versuchen Sie es zunächst mit `ENABLE_MOCK_MODE=true`, um die Funktionalität zu testen

## Server-Wartung

### Server-Überwachung

```bash
# Server-Status 
pm2 status

# Serverauslastung 
pm2 monit

# Logs ansehen 
pm2 logs scuric-backend
```

### Server-Updates

Um den Server nach Code-Updates zu aktualisieren:

```bash
# In das Projekt-Verzeichnis wechseln
cd /pfad/zum/Dashboard-Backoffice

# Änderungen abrufen
git pull

# Abhängigkeiten aktualisieren
cd backend
npm install

# Server neustarten
pm2 restart scuric-backend
```

## Produktionsempfehlungen

1. **Sicherheit**: Stellen Sie sicher, dass Ihr Server mit HTTPS konfiguriert ist
2. **Backup**: Richten Sie regelmäßige Backups für Ihre MongoDB-Datenbank ein
3. **Monitoring**: Verwenden Sie PM2 oder ein anderes Monitoring-Tool zur Überwachung
4. **Logs**: Richten Sie eine Log-Rotation ein, um Festplattenplatz zu sparen
5. **Redis-Persistenz**: Aktivieren Sie die Redis-Persistenz für wichtige Produktionssysteme:
   ```bash
   sudo nano /etc/redis/redis.conf
   # Aktivieren Sie AOF: appendonly yes
   sudo systemctl restart redis-server
   ```

## Nach der Installation

1. Öffnen Sie den PowerDialer in Ihrem Browser unter:
   ```
   https://ihre-domain.com/new-power-dialer
   ```

2. Melden Sie sich mit Ihren Anmeldedaten an

3. Testen Sie die Verbindung, indem Sie auf "Start Dialer" klicken

4. Überwachen Sie die Server-Logs mit `pm2 logs scuric-backend`, um Probleme zu identifizieren