// test-dialer.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Lade die Umgebungsvariablen
dotenv.config();

// Haupt-Test-Funktion für die PowerDialer API
const testPowerDialer = async () => {
  try {
    // 1. PowerDialer initialisieren
    console.log('1. PowerDialer initialisieren');
    const initResponse = await fetch('http://localhost:5000/api/dialer/initialize', {
      method: 'POST'
    });
    const initData = await initResponse.json();
    console.log('Initialisierung:', initData);
    
    // Verwende manuell eingefügte Testwerte für die API
    // In der Produktion würden diese Werte vom Frontend kommen
    const testUserId = '647f14d8e1c42b47a4ca2bb2'; // Beispiel-ID, du musst diese anpassen
    const aircallUserId = '1527216'; 
    const numberId = '967647';
    
    // 2. PowerDialer für einen Agenten starten
    console.log('\n2. PowerDialer für einen Agenten starten');
    const startResponse = await fetch(`http://localhost:5000/api/dialer/${testUserId}/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aircallUserId: aircallUserId.toString(),
        numberId: numberId.toString()
      })
    });
    
    const startData = await startResponse.json();
    console.log('PowerDialer Start:', startData);
    
    if (startData.success) {
      console.log('PowerDialer erfolgreich gestartet!');
    } else {
      console.error('Fehler beim Starten des PowerDialers:', startData.message);
      // Hier trotzdem weitermachen, um andere Tests auszuführen
    }
    
    // 3. Status des PowerDialers abrufen
    console.log('\n3. Status des PowerDialers abrufen');
    const statusResponse = await fetch(`http://localhost:5000/api/dialer/${testUserId}/status`);
    const statusData = await statusResponse.json();
    console.log('PowerDialer Status:', statusData);
    
    // 4. Direkt einen Anruf starten mit dem Aircall API Proxy
    console.log('\n4. Direkt einen Anruf starten');
    const dialResponse = await fetch(`http://localhost:5000/api/aircall/users/${aircallUserId}/dial`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: '+491771234567' // Testnummer im E.164-Format
      })
    });
    
    // Da die Antwort ein 204 No Content ist, gibt es keinen JSON-Body
    console.log('Dial-Anruf Statuscode:', dialResponse.status);
    
    if (dialResponse.status === 204) {
      console.log('Anruf erfolgreich initiiert');
    } else {
      const dialData = await dialResponse.text();
      console.error('Fehler beim Starten des Anrufs:', dialData);
    }
    
    // 5. Einige Nummern zur Anrufwarteschlange hinzufügen
    console.log('\n5. Telefonnummern zur Anrufwarteschlange hinzufügen');
    const queueResponse = await fetch('http://localhost:5000/api/dialer/queue', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumbers: [
          '+491771234567',
          '+491771234568',
          '+491771234569'
        ],
        userId: testUserId,
        options: {
          priority: 5,
          notes: 'Testanrufe über API'
        }
      })
    });
    
    const queueData = await queueResponse.json();
    console.log('Nummern zur Warteschlange hinzugefügt:', queueData);
    
    // Zeige, dass die Tests abgeschlossen sind
    console.log('\nAlle Tests abgeschlossen!');
    
  } catch (error) {
    console.error('Fehler beim Testen des PowerDialers:', error);
  }
};

// Führe die Tests aus
testPowerDialer();