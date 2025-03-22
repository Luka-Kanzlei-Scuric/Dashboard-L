# Scuric Dashboard Backend

Backend-API für das Scuric Kanzlei-Dashboard mit bidirektionaler Make.com-Integration zur Synchronisierung mit ClickUp.

## Features

- RESTful API für Mandantenverwaltung
- MongoDB-Integration für Datenpersistenz
- Bidirektionale Make.com-Webhooks
- Synchronisierung mit ClickUp
- Änderungsverfolgungssystem

## Installation

1. Repository klonen
2. In das Backend-Verzeichnis wechseln:
   ```
   cd backend
   ```
3. Abhängigkeiten installieren:
   ```
   npm install
   ```
4. Umgebungsvariablen konfigurieren:
   Erstelle eine `.env`-Datei mit folgenden Variablen:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scuric-dashboard
   PORT=5000
   CORS_ORIGIN=http://localhost:3000,https://scuric-dashboard.vercel.app
   ```

5. Server starten:
   ```
   npm run dev
   ```

## API-Endpunkte

### Mandanten (Clients)

- `GET /api/clients` - Alle Mandanten abrufen
- `GET /api/clients/:id` - Einzelnen Mandanten abrufen
- `POST /api/clients` - Neuen Mandanten erstellen
- `PUT /api/clients/:id` - Mandanten aktualisieren
- `DELETE /api/clients/:id` - Mandanten löschen

### Webhooks für Make.com

- `POST /api/webhook/clickup-to-dashboard` - Daten von ClickUp empfangen
- `GET /api/webhook/dashboard-to-clickup` - Änderungen für ClickUp bereitstellen

### System

- `GET /api/health` - Systemstatus prüfen

## Make.com-Integration

Das Backend ist für eine bidirektionale Integration mit Make.com konfiguriert:

1. **ClickUp zu Dashboard:** Make.com ruft Daten aus ClickUp ab und sendet sie an den Webhook-Endpunkt `/api/webhook/clickup-to-dashboard`.

2. **Dashboard zu ClickUp:** Make.com ruft regelmäßig `/api/webhook/dashboard-to-clickup` ab, um Änderungen aus dem Dashboard an ClickUp zu senden.

## Deployment auf Vercel

1. Melde dich bei Vercel an
2. Verknüpfe dieses Repository
3. Konfiguriere die Umgebungsvariablen (MONGODB_URI, CORS_ORIGIN)
4. Deploye das Projekt

## Änderungsverfolgung

Das Backend führt eine Warteschlange aller Änderungen, die von Make.com an ClickUp gesendet werden müssen:
- Neue Mandanten werden für die Erstellung in ClickUp markiert
- Aktualisierte Mandanten werden für die Synchronisierung markiert
- Gelöschte Mandanten werden für die Löschung in ClickUp markiert