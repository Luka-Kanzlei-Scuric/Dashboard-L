# Make.com-Integration für Scuric Dashboard

Diese Anleitung erklärt, wie du Make.com-Szenarien für die Integrationen mit dem Scuric Dashboard einrichtest.

## Übersicht

Wir benötigen drei separate Make.com-Szenarien:

1. **ClickUp zum Dashboard** - Sendet Mandantendaten aus ClickUp an das Dashboard
2. **Dashboard zu ClickUp** - Sendet Änderungen vom Dashboard an ClickUp
3. **Email-Versand via Make.com** - Verarbeitet Email-Daten vom Dashboard und sendet Emails mit Anhängen an Mandanten

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

## 3. Szenario: Email-Versand via Make.com

Dieses Szenario verarbeitet Email-Anfragen vom Dashboard und sendet die eigentlichen Emails über Make.com an Mandanten.

### Einrichtung:

1. **Neues Szenario erstellen**:
   - Gib dem Szenario einen aussagekräftigen Namen, z.B. "Scuric Email Versand"
   - Wähle als Trigger "Webhook" aus

2. **Webhook konfigurieren**:
   - Erstelle einen neuen Webhook
   - Der Webhook ist bereits bei uns konfiguriert: `https://hook.eu2.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki`
   - Speichere die URL des Webhooks (diese wird im Dashboard bereits verwendet)

3. **Module hinzufügen**:

   a. **Webhook - Daten empfangen**:
      - Dieser Trigger erhält die Daten vom Dashboard
      - Eingehende Daten-Struktur:
      ```json
      {
        "client": {
          "id": "client-id",
          "name": "Mandantenname",
          "email": "email@beispiel.de",
          "phone": "0123456789",
          "honorar": "1500",
          "raten": 3,
          "ratenStart": "01.01.2025",
          "caseNumber": "2024-ABC-123"
        },
        "portalUrl": "https://portal.scuric.de/portal/client-id",
        "invoice": {
          "invoiceNumber": "RE-2024-001",
          "date": "15.03.2025",
          "amount": "1500",
          "dueDate": "31.03.2025"
        },
        "attachment": {
          "fileName": "Rechnung-2024-001.pdf",
          "fileType": "application/pdf",
          "base64Content": "base64-encoded-content-here"
        }
      }
      ```

   b. **Email - Sende Email**:
      - Verbinde deinen Email-Dienst (z.B. Gmail, Outlook, SMTP)
      - Konfiguriere die Email:
        - From: "Rechtsanwaltskanzlei Scuric <kontakt@schuldnerberatung-anwalt.de>"
        - To: `{{1.client.email}}`
        - Subject: `Ihr Mandantenportal und Zahlungsinformationen - {{1.client.caseNumber}}`
        - HTML Body: Verwende die HTML-Vorlage aus unserem Template
        - Anhänge: Verwende die Base64-Daten aus dem Webhook
      
   c. **Optional: HTTP - Anfrage an Dashboard zurücksenden**:
      - Methode: POST
      - URL: `https://dashboard.scuric.de/api/email-status-callback`
      - Body: Status über erfolgreichen Versand
      
### Email-Template

Hier ist das HTML-Template für die Email (im Make.com zu verwenden):

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Willkommen bei Scuric Rechtsanwaltskanzlei</title>
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
}
.logo-container {
  margin-top: 30px;
  margin-bottom: 40px;
}
.logo {
  max-width: 250px;
}
.media-section {
  text-align: center;
  margin-top: -10px;
  margin-bottom: 40px;
}
.media-logos {
  max-width: 400px;
  margin: 0 auto;
  display: block;
}
.button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #32a852;
  color: white !important;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  margin: 20px 0;
}
.footer {
  margin-top: 20px;
  font-size: 0.9em;
}
.spacing {
  margin-bottom: 20px;
}
.media-text {
  font-size: 0.8em;
  color: #666;
  text-align: center;
  margin-top: 10px;
}
.greeting {
  margin-top: 40px;
}
.signature {
  margin-top: 20px;
  margin-bottom: 40px;
}
.button-container {
  text-align: center;
  margin-bottom: 10px;
}
.url-container {
  text-align: center;
  margin-bottom: 30px;
  font-size: 0.9em;
  color: #555;
}
.direct-url {
  word-break: break-all;
  color: #32a852;
}
.important {
  font-weight: bold;
  color: #324ca8;
}
</style>
</head>
<body>
  <div class="logo-container">
    <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" alt="Thomas Scuric Rechtsanwalt" class="logo">
  </div>
  <p class="greeting">Sehr geehrte(r) {{1.client.name}},</p>

  <p class="spacing">zunächst einmal vielen Dank für Ihr Vertrauen und die Erteilung des Mandats. Wir freuen uns, Sie auf Ihrem Weg in eine schuldenfreie Zukunft begleiten zu dürfen.</p>

  <p class="spacing">Wie vereinbart beträgt unser Gesamthonorar pauschal {{1.client.honorar}}€ (inkl. 19% MwSt.), welches Sie in {{1.client.raten}} Raten bezahlen können.</p>

  <p>Um mit dem Schreiben an Ihre Gläubiger beginnen zu können, bitten wir Sie, die erste Rate bis zum <span class="important">{{1.client.ratenStart}}</span> zu überweisen. Nach Zahlungseingang nehmen wir umgehend Kontakt mit Ihren Gläubigern auf.</p>

  <p class="spacing">Für eine erfolgreiche Zusammenarbeit haben wir ein persönliches Mandantenportal für Sie eingerichtet. Dort können Sie Ihre Gläubigerschreiben hochladen und den Fortschritt Ihres Verfahrens einsehen.</p>

  <p>Ihr <span class="important">persönliches Aktenzeichen</span> lautet: <span class="important">{{1.client.caseNumber}}</span></p>

  <p>Bitte nutzen Sie dieses Aktenzeichen für Ihren Zugang zum Mandantenportal:</p>
  <div class="button-container">
    <a href="{{1.portalUrl}}" class="button">-> Zum Mandantenportal <-</a>
  </div>
  <div class="url-container">
    Falls der Button nicht funktioniert, kopieren Sie bitte diese URL direkt in Ihren Browser:<br>
    <span class="direct-url">{{1.portalUrl}}</span>
  </div>
  
  {{#if 1.invoice}}
  <div style="padding: 15px; margin-top: 20px; background-color: #f2f7ff; border-radius: 10px; border: 1px solid #d1e0ff;">
    <p style="font-weight: bold; color: #324ca8;">Rechnungsinformationen:</p>
    <p>Rechnungsnummer: {{1.invoice.invoiceNumber}}</p>
    <p>Rechnungsdatum: {{1.invoice.date}}</p>
    <p>Betrag: {{1.invoice.amount}}€</p>
    <p>Zahlbar bis: {{1.invoice.dueDate}}</p>
    <p>Die Rechnung ist dieser E-Mail als Anhang beigefügt.</p>
  </div>
  {{/if}}

  <div class="media-section">
    <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2019/11/medien.png" alt="RTL, Focus Online, Frankfurter Rundschau" class="media-logos">
    <p class="media-text">Vielleicht kennen Sie uns auch aus diesen Medien</p>
  </div>
  <p>Mit freundlichen Grüßen</p>

  <p class="signature">Ihr Team von der Rechtsanwaltskanzlei Thomas Scuric</p>
  <div class="footer">
    <p>Rechtsanwaltskanzlei Thomas Scuric<br>
    Bongardstraße 33<br>
    44787 Bochum</p>

    <p>Fon: 0234 913 681 – 0<br>
    Fax: 0234 913 681 – 29<br>
    E-Mail: kontakt@schuldnerberatung-anwalt.de</p>
  </div>
</body>
</html>
```

## Endpunkte-Referenz

- **Dashboard zu ClickUp**: `GET https://scuric-backend.vercel.app/api/webhook/dashboard-to-clickup`
  - Gibt Änderungen zurück, die an ClickUp gesendet werden sollen
  - Format: `{ "changes": [...] }`

- **ClickUp zu Dashboard**: `POST https://scuric-backend.vercel.app/api/webhook/clickup-to-dashboard`
  - Erwartet ClickUp-Aufgaben zum Importieren ins Dashboard
  - Format: `{ "tasks": [...] }`

- **Email-Webhook**: `POST https://hook.eu2.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki`
  - Empfängt Email-Daten vom Dashboard
  - Sendet Emails an Mandanten mit Portal-Zugang und Rechnungen
  - Format: Siehe Struktur oben

## Tests

Nach der Einrichtung solltest du Folgendes testen:

1. Erstelle eine Testaufgabe in ClickUp und prüfe, ob sie im Dashboard erscheint
2. Aktualisiere einen Mandanten im Dashboard und prüfe, ob die Änderungen in ClickUp ankommen
3. Lösche einen Mandanten im Dashboard und prüfe, ob die Änderung in ClickUp reflektiert wird
4. Sende eine Test-Email über das Dashboard und prüfe, ob sie über Make.com korrekt versendet wird