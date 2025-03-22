# Make.com-Integration für Scuric Dashboard

Diese Anleitung erklärt, wie du Make.com-Szenarien für die bidirektionale Synchronisierung zwischen ClickUp und dem Scuric Dashboard einrichtest.

## Übersicht

Wir benötigen zwei separate Make.com-Szenarien:

1. **ClickUp zum Dashboard** - Sendet Mandantendaten aus ClickUp an das Dashboard
2. **Dashboard zu ClickUp** - Sendet Änderungen vom Dashboard an ClickUp

## 1. Szenario: ClickUp zum Dashboard

Dieses Szenario wird alle 15 Minuten ausgeführt und sendet Daten von ClickUp an das Dashboard.

### Einrichtung:

1. **Neues Szenario erstellen**:
   - Gib dem Szenario einen aussagekräftigen Namen, z.B. "ClickUp zu Scuric Dashboard"
   - Wähle ein Planungsintervall von 15 Minuten

2. **Module hinzufügen**:

   a. **ClickUp - Aufgaben in einer Liste abrufen**:
      - Verbinde dein ClickUp-Konto
      - Wähle die Onboarding-Liste aus
      - Optional: Filtere nach Status, um nur relevante Aufgaben zu erhalten

   b. **HTTP - Eine Anfrage senden**:
      - Methode: POST
      - URL: `https://scuric-backend.vercel.app/api/webhook/clickup-to-dashboard`
      - Headers: 
        ```
        Content-Type: application/json
        ```
      - Body-Typ: JSON
      - Body: 
        ```json
        {
          "tasks": {{1.tasks}}
        }
        ```

   c. **Optional: Telegram/Email Benachrichtigung bei Fehlern**:
      - Füge eine Bedingung hinzu, die prüft, ob die HTTP-Anfrage erfolgreich war
      - Sende eine Benachrichtigung, wenn Fehler auftreten

### Struktur des Szenarios:

```
[ClickUp: Aufgaben abrufen] --> [HTTP: Daten an Dashboard senden] --> [Optional: Fehlerbenachrichtigung]
```

## 2. Szenario: Dashboard zu ClickUp

Dieses Szenario wird alle 15 Minuten ausgeführt und holt Änderungen vom Dashboard, um sie in ClickUp zu synchronisieren.

### Einrichtung:

1. **Neues Szenario erstellen**:
   - Gib dem Szenario einen aussagekräftigen Namen, z.B. "Scuric Dashboard zu ClickUp"
   - Wähle ein Planungsintervall von 15 Minuten

2. **Module hinzufügen**:

   a. **HTTP - Eine Anfrage senden**:
      - Methode: GET
      - URL: `https://scuric-backend.vercel.app/api/webhook/dashboard-to-clickup`
      - Antwort parsen: Ja

   b. **Iterator**:
      - Array: `{{1.changes}}`
      - Dieses Modul wird alle Änderungen durchlaufen

   c. **Router**:
      - Füge drei Wege basierend auf `{{i.changeType}}` hinzu:
        1. "create" - Für neue Mandanten
        2. "update" - Für Aktualisierungen
        3. "delete" - Für Löschungen

   d. **ClickUp-Module für jeden Router-Pfad**:
      
      1. Für "create":
         - **ClickUp - Eine Aufgabe erstellen**:
           - Liste: Onboarding-Liste-ID
           - Name: `{{i.client.name}}`
           - Beschreibung: Erstelle eine Beschreibung mit den Client-Daten
           - Benutzerdefinierte Felder: Setze E-Mail und Telefon

      2. Für "update":
         - **ClickUp - Eine Aufgabe aktualisieren**:
           - Aufgaben-ID: `{{i.client.clickupId}}`
           - Name: `{{i.client.name}}`
           - Benutzerdefinierte Felder: Aktualisiere E-Mail und Telefon

      3. Für "delete":
         - **ClickUp - Aufgabe löschen** oder **ClickUp - Status ändern**:
           - Aufgaben-ID: `{{i.client.clickupId}}`
           - (Je nach Anforderung entweder löschen oder Status auf "Gelöscht" setzen)

### Struktur des Szenarios:

```
[HTTP: Änderungen abrufen] --> [Iterator] --> [Router] --> [ClickUp: Entsprechende Aktion]
```

## Tipps zur Fehlerbehandlung

1. **Protokollierung**: Füge Text-Parser-Module hinzu, um wichtige Informationen zu protokollieren

2. **Wiederholungsversuche**: Konfiguriere Wiederholungsversuche für die HTTP-Module bei temporären Fehlern

3. **Fehlermeldung**: Füge Benachrichtigungsmodule hinzu, um über Probleme informiert zu werden

4. **Data Storage**: Verwende Make.com Data Storage zum Speichern von Synchronisierungsstatus und Fehlern

## Endpunkte-Referenz

- **Dashboard zu ClickUp**: `GET https://scuric-backend.vercel.app/api/webhook/dashboard-to-clickup`
  - Gibt Änderungen zurück, die an ClickUp gesendet werden sollen
  - Format: `{ "changes": [...] }`

- **ClickUp zu Dashboard**: `POST https://scuric-backend.vercel.app/api/webhook/clickup-to-dashboard`
  - Erwartet ClickUp-Aufgaben zum Importieren ins Dashboard
  - Format: `{ "tasks": [...] }`

## Tests

Nach der Einrichtung solltest du Folgendes testen:

1. Erstelle eine Testaufgabe in ClickUp und prüfe, ob sie im Dashboard erscheint
2. Aktualisiere einen Mandanten im Dashboard und prüfe, ob die Änderungen in ClickUp ankommen
3. Lösche einen Mandanten im Dashboard und prüfe, ob die Änderung in ClickUp reflektiert wird