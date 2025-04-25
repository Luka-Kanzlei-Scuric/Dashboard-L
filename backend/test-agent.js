import fetch from 'node-fetch';

// Dieser Test aktiviert einen Agenten für den PowerDialer
// Verwendung des angegebenen Aircall-Benutzer-ID und Nummer
const testStartDialer = async () => {
  try {
    console.log('Starte Test: PowerDialer-Agent aktivieren');
    
    // Du müsstest hier die Benutzer-ID deines MongoDB-Benutzers einfügen
    // Wir verwenden eine Beispiel-ID, die du durch eine gültige ID ersetzen musst
    const userId = '647f14d8e1c42b47a4ca2bb2'; // Beispiel-ID
    const aircallUserId = '1527216';  // Die Aircall-Benutzer-ID, die du angegeben hast
    const numberId = '967647';        // Die Aircall-Nummer-ID, die du angegeben hast
    
    const response = await fetch(`http://localhost:5000/api/dialer/${userId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aircallUserId,
        numberId
      })
    });
    
    const data = await response.json();
    console.log('Antwort vom Server:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('PowerDialer erfolgreich gestartet!');
    } else {
      console.error('Fehler beim Starten des PowerDialers:', data.message);
    }
  } catch (error) {
    console.error('Fehler bei der Anfrage:', error.message);
  }
};

// Test ausführen
testStartDialer();