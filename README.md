# Anwaltskanzlei Dashboard (Frontend)

Ein modernes, Apple-inspiriertes Dashboard für das Backoffice einer Anwaltskanzlei. Das Dashboard zeichnet sich durch ein minimalistisches, elegantes Design aus, das sich an der Ästhetik von Apple-Produkten orientiert.

## Projektstruktur

Dieses Projekt wurde in zwei Teile aufgeteilt:

1. **Frontend (dieses Repository)** - React-Anwendung mit Tailwind CSS
2. **Backend (im /backend Verzeichnis)** - Express API-Server mit MongoDB-Integration

## SipGate Dialer Integration

Der Power Dialer unterstützt jetzt auch SipGate als Telefonie-Anbieter neben Aircall.

### Konfiguration für SipGate

Um die SipGate-Integration zu nutzen, müssen Sie folgende Umgebungsvariablen in der `.env`-Datei im Backend-Verzeichnis konfigurieren:

```
# SipGate API Configuration
SIPGATE_TOKEN_ID=your_sipgate_token_id
SIPGATE_TOKEN=your_sipgate_token
SIPGATE_DEVICE_ID=e0  # Web phone extension (e.g. 'e0', 'x0', 'y0')
SIPGATE_CALLER_ID=+491234567890  # Your SipGate phone number for outgoing calls
```

### Web Phone Extension ermitteln

Die SIPGATE_DEVICE_ID ist Ihre Web Phone Extension bei SipGate. Diese können Sie wie folgt herausfinden:

1. Loggen Sie sich in Ihrem [sipgate-Account](https://app.sipgate.com/login) ein
2. Gehen Sie über die Seitenleiste zum Tab **Telefone** (_Phones_)
3. Klicken Sie auf das Gerät, für das Sie die Web Phone Extension benötigen
4. Die URL dieser Seite sollte das folgende Format haben: `https://app.sipgate.com/{...}/devices/{deviceId}`, wobei `{deviceId}` Ihre Web Phone Extension ist

Abhängig von Ihren Anforderungen können Sie verschiedene Telefon-Typen verwenden:

| Telefon-Typ     | Buchstabe |
| --------------- | --------- |
| VoIP-Telefon    | e         |
| Externes Telefon| x         |
| Mobiltelefon    | y         |

### API-Zugriff einrichten

Um die SipGate API nutzen zu können, müssen Sie ein Token mit dem Bereich `sessions:calls:write` erstellen:

1. Gehen Sie zu [console.sipgate.com](https://console.sipgate.com/)
2. Navigieren Sie zu "Personal Access Tokens"
3. Erstellen Sie ein neues Token mit dem Bereich `sessions:calls:write`
4. Speichern Sie die Token-ID und das Token in Ihrer `.env`-Datei

### Verwendung im Frontend

Die Komponente `SipgateDialer` ist im Frontend implementiert und kann auf der Seite "Einfacher Dialer" verwendet werden. Diese Komponente ermöglicht es, direkte Anrufe über die SipGate API zu tätigen.

## Features

- Elegante, minimalistische UI im Apple-Design
- Responsive Layout für Desktop und mobile Geräte
- Mandantenverwaltung mit übersichtlicher Darstellung
- Moderne React-Komponenten mit Tailwind CSS
- Bidirektionale Integration mit dem Backend-Server
- Automatische Aktualisierung der Mandantendaten

## Technologien

- React 18
- React Router v6
- Tailwind CSS für das Styling
- Heroicons für Icons
- Axios für API-Anfragen
- Vite als Build-Tool
- Vercel für das Deployment

## Installation

1. Repository klonen
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. Entwicklungsserver starten:
   ```
   npm run dev
   ```

## Deployment auf Vercel

1. Installiere die Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Anmelden bei Vercel:
   ```
   vercel login
   ```

3. Projekt deployen:
   ```
   vercel
   ```

4. Umgebungsvariablen in der Vercel Dashboard hinzufügen (falls benötigt):
   - VITE_API_URL - URL des Backend-Servers

## Bidirektionale Synchronisierung

Die Frontend-Anwendung ist so konfiguriert, dass sie mit dem Backend-Server kommuniziert, der wiederum mit ClickUp über Make.com verbunden ist:

1. **Frontend zu Backend**: Wenn Änderungen im Dashboard vorgenommen werden, werden diese an das Backend gesendet und zur späteren Synchronisierung mit ClickUp in eine Warteschlange eingereiht.

2. **Backend zu Frontend**: Das Frontend ruft regelmäßig die neuesten Mandantendaten vom Backend ab. Diese Daten werden vom Backend mit ClickUp über Make.com synchronisiert.

## Backend Integration

Für vollständige Funktionalität muss das Backend-System separat bereitgestellt werden:

1. Siehe `/backend` für Installationsanweisungen und API-Dokumentation
2. Stellen Sie sicher, dass die `VITE_API_URL`-Umgebungsvariable im Frontend so konfiguriert ist, dass sie auf die Backend-URL verweist

## Design-Prinzipien

- Minimalismus: Reduktion auf das Wesentliche
- Klare Typografie und Hierarchie
- Elegante, zurückhaltende Farbpalette
- Intuitive Benutzerführung
- Visuelle Konsistenz über alle Komponenten hinweg