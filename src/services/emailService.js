import axios from 'axios';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Make.com webhook URL for sending emails - Direkte URL verwenden
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki';

/**
 * Generate the client portal URL
 * @param {Object} client - Client object
 * @returns {string} Full URL to client portal
 */
export function generateClientPortalUrl(client) {
  const baseUrl = process.env.CLIENT_PORTAL_BASE_URL || 'https://dashboard-l.onrender.com';
  return `${baseUrl}/portal/${client._id}`;
}

/**
 * Generate email content for preview or sending
 * @param {Object} client - Client data
 * @param {Object} invoiceData - Optional invoice data
 * @returns {String} HTML content of the email
 */
export function generateWelcomeEmailContent(client, invoiceData = null) {
  // Format date for payment
  const formattedRatenStart = client.ratenStart || '01.01.2025';
  const honorarDisplay = client.honorar ? `${client.honorar}€` : 'den vereinbarten Betrag';
  const portalUrl = generateClientPortalUrl(client);
  const ratenValue = client.raten || 3;
  
  // Generate invoice info if available
  let invoiceInfo = '';
  if (invoiceData) {
    invoiceInfo = `
    <div class="invoice-box">
      <h3 class="invoice-title">Rechnungsinformationen:</h3>
      <p class="invoice-item">Rechnungsnummer: ${invoiceData.invoiceNumber || '-'}</p>
      <p class="invoice-item">Rechnungsdatum: ${invoiceData.date || new Date().toLocaleDateString('de-DE')}</p>
      <p class="invoice-item">Betrag: ${invoiceData.amount || client.honorar || 1111}€</p>
      <p class="invoice-item">Zahlbar bis: ${invoiceData.dueDate ? invoiceData.dueDate : ''}</p>
      <p class="invoice-item">Die Rechnung finden Sie in Ihrem persönlichen Mandantenportal.</p>
    </div>
    `;
  }
  
  // Construct email HTML
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei Scuric Rechtsanwaltskanzlei</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .logo-container {
      text-align: center;
      margin: 30px auto 40px;
    }
    .logo {
      max-width: 300px;
      height: auto;
    }
    .media-section {
      text-align: center;
      margin: 40px auto;
    }
    .media-logos {
      max-width: 400px;
      margin: 0 auto;
      display: block;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #32a852;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
      transition: all 0.2s ease;
    }
    .button:hover {
      background-color: #2a9247;
      transform: translateY(-1px);
    }
    .footer {
      margin-top: 40px;
      font-size: 0.9em;
      color: #666;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .spacing {
      margin-bottom: 20px;
    }
    .media-text {
      font-size: 0.85em;
      color: #666;
      text-align: center;
      margin-top: 10px;
    }
    .greeting {
      margin-top: 40px;
      font-weight: 500;
    }
    .signature {
      margin-top: 30px;
      margin-bottom: 40px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .url-container {
      text-align: center;
      margin-bottom: 30px;
      font-size: 0.9em;
      color: #666;
    }
    .direct-url {
      word-break: break-all;
      color: #32a852;
    }
    .important {
      font-weight: 600;
      color: #324ca8;
    }
    .invoice-box {
      padding: 20px;
      margin: 30px 0;
      background-color: #f2f7ff;
      border-radius: 12px;
      border: 1px solid #d1e0ff;
    }
    .invoice-title {
      font-weight: 600;
      color: #324ca8;
      margin-top: 0;
    }
    .invoice-item {
      margin: 10px 0;
    }
    p {
      margin: 12px 0;
    }
    h1, h2, h3 {
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" alt="Thomas Scuric Rechtsanwalt" class="logo">
    </div>
    
    <p class="greeting">Sehr geehrte(r) ${client.name},</p>
    
    <p class="spacing">zunächst einmal vielen Dank für Ihr Vertrauen und die Erteilung des Mandats. Wir freuen uns, Sie auf Ihrem Weg in eine schuldenfreie Zukunft begleiten zu dürfen.</p>
    
    <p class="spacing">Wie vereinbart beträgt unser Gesamthonorar pauschal ${honorarDisplay} (inkl. 19% MwSt.), welches Sie in ${ratenValue} Raten bezahlen können.</p>
    
    <p>Um mit dem Schreiben an Ihre Gläubiger beginnen zu können, bitten wir Sie, die erste Rate bis zum <span class="important">${formattedRatenStart}</span> zu überweisen. Nach Zahlungseingang nehmen wir umgehend Kontakt mit Ihren Gläubigern auf.</p>
    
    <p class="spacing">Für eine erfolgreiche Zusammenarbeit haben wir ein persönliches Mandantenportal für Sie eingerichtet. Dort können Sie Ihre Gläubigerschreiben hochladen und den Fortschritt Ihres Verfahrens einsehen.</p>
    
    <p>Ihr <span class="important">persönliches Aktenzeichen</span> lautet: <span class="important">${client.caseNumber || 'Wird in Kürze vergeben'}</span></p>
    
    <p>Bitte nutzen Sie dieses Aktenzeichen für Ihren Zugang zum Mandantenportal:</p>
    
    <div class="button-container">
      <a href="${portalUrl}" class="button">Zum Mandantenportal</a>
    </div>
    
    <div class="url-container">
      Falls der Button nicht funktioniert, kopieren Sie bitte diese URL direkt in Ihren Browser:<br>
      <span class="direct-url">${portalUrl}</span>
    </div>
    
    ${invoiceInfo}

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
  </div>
</body>
</html>`;
}

/**
 * Send welcome email data to Make.com webhook for email sending
 * @param {Object} client - Client object with all data
 * @param {Object} invoiceData - Optional invoice data with filePath
 * @returns {Promise} Webhook call result
 */
export async function sendWelcomePortalEmail(client, invoiceData = null) {
  try {
    // Get PDF base64 if we have an invoice file
    let invoiceBase64 = null;
    let fileName = null;
    let fileType = null;

    // Log Client ID for debugging
    console.log('Client ID for webhook call:', client._id);

    if (invoiceData && invoiceData.filePath) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Create absolute file path
        const rootDir = process.cwd();
        const filePath = invoiceData.filePath.startsWith('/')
          ? invoiceData.filePath
          : path.join(rootDir, invoiceData.filePath.replace(/^\/+/, ''));
        
        // Check if file exists
        await fs.access(filePath);
        
        // Determine file type
        const fileExtension = path.extname(filePath).toLowerCase();
        fileType = 'application/pdf'; // Default
        
        if (fileExtension === '.pdf') {
          fileType = 'application/pdf';
        } else if (['.jpg', '.jpeg'].includes(fileExtension)) {
          fileType = 'image/jpeg';
        } else if (fileExtension === '.png') {
          fileType = 'image/png';
        } else if (['.doc', '.docx'].includes(fileExtension)) {
          fileType = 'application/msword';
        }
        
        // Read file and convert to base64
        const fileContent = await fs.readFile(filePath);
        invoiceBase64 = fileContent.toString('base64');
        fileName = invoiceData.fileName || path.basename(filePath);
        
        console.log(`Invoice file prepared for Make.com: ${filePath}`);
      } catch (fileError) {
        console.error('Error preparing invoice file:', fileError);
      }
    }

    // Prepare client data for Make.com
    const clientData = {
      id: client._id,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      honorar: client.honorar || '',
      raten: client.raten || 3,
      ratenStart: client.ratenStart || '01.01.2025',
      caseNumber: client.caseNumber || 'Wird in Kürze vergeben'
    };

    // Prepare invoice data for Make.com
    const invoiceDetails = invoiceData ? {
      invoiceNumber: invoiceData.invoiceNumber || '',
      date: invoiceData.date || new Date().toLocaleDateString('de-DE'),
      amount: invoiceData.amount || client.honorar || '',
      dueDate: invoiceData.dueDate && typeof invoiceData.dueDate === 'string' ? invoiceData.dueDate.trim() : ''
    } : null;

    // Create portal URL for the client
    const portalUrl = generateClientPortalUrl(client);

    // Verwende die tatsächliche hochgeladene PDF-URL, falls vorhanden
    let invoiceURL = null;
    let invoiceFileInfo = null;
    
    if (invoiceData?.invoiceURL) {
      // Verwende direkt die hochgeladene PDF-URL
      invoiceURL = invoiceData.invoiceURL;
      
      // Erfasse Dateiinformationen falls vorhanden
      if (invoiceData.fileName || invoiceData.fileSize || invoiceData.mimeType) {
        invoiceFileInfo = {
          fileName: invoiceData.fileName || 'Rechnung.pdf',
          fileSize: invoiceData.fileSize || '',
          mimeType: invoiceData.mimeType || 'application/pdf'
        };
      }
    } else if (invoiceDetails) {
      // Fallback: Generiere eine sichere URL, falls keine hochgeladene PDF vorhanden ist
      const securityToken = Buffer.from(`${client._id}-${new Date().getTime()}`).toString('base64')
        .replace(/[=+/]/g, '');
      
      // URL erstellen
      invoiceURL = `https://dashboard-l.onrender.com/portal/${client._id}`;
    }
    
    // Create data payload for Make.com
    const makeData = {
      client: clientData,
      portalUrl: portalUrl,
      invoice: invoiceDetails,
      // Füge Anhang nur hinzu, wenn explizit gewünscht und vorhanden UND keine URL gesetzt ist
      attachment: invoiceBase64 && !invoiceURL ? {
        fileName: fileName,
        fileType: fileType,
        base64Content: invoiceBase64
      } : null,
      // Füge Rechnungs-URL hinzu
      invoiceURL: invoiceURL,
      // Füge Dateiinformationen hinzu, falls vorhanden
      invoiceFile: invoiceFileInfo,
      // Include raw client data for easier debugging
      rawClient: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        honorar: client.honorar,
        raten: client.raten,
        ratenStart: client.ratenStart,
        caseNumber: client.caseNumber,
        // Include any other potentially useful fields
        currentPhase: client.currentPhase,
        emailSent: client.emailSent
      },
      // Add timestamp for debugging
      timestamp: new Date().toISOString()
    };

    // Log make data for debugging (without the attachment base64 content)
    const logData = {...makeData};
    if (logData.attachment && logData.attachment.base64Content) {
      logData.attachment.base64Content = '[BASE64_CONTENT]';
    }
    console.log('Webhook URL:', MAKE_WEBHOOK_URL);
    console.log('Data payload (sanitized):', JSON.stringify(logData, null, 2));
    
    // Custom error handling for different scenarios
    try {
      // Try to send data with axios 
      const response = await axios.post(MAKE_WEBHOOK_URL, makeData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 20000 // 20 second timeout
      });
      
      console.log('Email data sent to Make.com webhook:', response.status);
      console.log('Make.com response:', response.data);
      
      return {
        success: true,
        makeResponse: response.data,
        sentTo: client.email
      };
    } catch (axiosError) {
      console.error('Axios webhook call failed:', axiosError.message);
      
      // Try with fetch as a fallback (works in browser and Node.js environments)
      console.log('Trying with fetch API as fallback...');
      try {
        // Use global fetch or import it if needed
        const fetchModule = typeof fetch === 'undefined' ? await import('node-fetch') : null;
        const fetchFunction = fetchModule ? fetchModule.default : fetch;
        
        const fetchResponse = await fetchFunction(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(makeData)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error with fetch! Status: ${fetchResponse.status}`);
        }
        
        const responseData = await fetchResponse.json();
        console.log('Fetch webhook call succeeded:', responseData);
        
        return {
          success: true,
          makeResponse: responseData,
          sentTo: client.email,
          method: 'fetch'
        };
      } catch (fetchError) {
        console.error('Fetch webhook call also failed:', fetchError.message);
        throw new Error(`Failed to send email data using both axios and fetch: ${fetchError.message}`);
      }
    }
  } catch (error) {
    console.error('Error sending data to Make.com webhook:', error);
    
    // Try last resort method - send without attachments if appropriate
    if (invoiceBase64) {
      console.log('Attempting last resort method - sending without attachment...');
      try {
        // Still include all required client data, just omit the attachment
        const clientData = {
          id: client._id,
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          honorar: client.honorar || '',
          raten: client.raten || 3,
          ratenStart: client.ratenStart || '01.01.2025',
          caseNumber: client.caseNumber || 'Wird in Kürze vergeben'
        };
        
        // Generiere eine Rechnungs-URL als Alternative zum Anhang
        const invoiceDetails = invoiceData ? {
          invoiceNumber: invoiceData.invoiceNumber || '',
          date: invoiceData.date || new Date().toLocaleDateString('de-DE'),
          amount: invoiceData.amount || client.honorar || '',
          dueDate: invoiceData.dueDate && typeof invoiceData.dueDate === 'string' ? invoiceData.dueDate.trim() : ''
        } : null;
        
        // Verwende tatsächliche PDF-URL falls vorhanden
        let invoiceURL = null;
        let invoiceFileInfo = null;
        
        if (invoiceData?.invoiceURL) {
          // Verwende die vorhandene URL
          invoiceURL = invoiceData.invoiceURL;
          
          // Einbeziehen von Dateiinformationen falls vorhanden
          if (invoiceData.fileName || invoiceData.fileSize || invoiceData.mimeType) {
            invoiceFileInfo = {
              fileName: invoiceData.fileName || 'Rechnung.pdf',
              fileSize: invoiceData.fileSize || '',
              mimeType: invoiceData.mimeType || 'application/pdf'
            };
          }
        } else if (invoiceDetails) {
          // Fallback: Generiere eine sichere URL
          const securityToken = Buffer.from(`${client._id}-${new Date().getTime()}`).toString('base64')
            .replace(/[=+/]/g, '');
          invoiceURL = `https://dashboard-l.onrender.com/portal/${client._id}`;
        }
        
        const simplePayload = {
          client: clientData,
          portalUrl: generateClientPortalUrl(client),
          invoice: invoiceDetails,
          // Füge die Rechnungs-URL hinzu
          invoiceURL: invoiceURL,
          // Füge Dateiinformationen hinzu, falls vorhanden
          invoiceFile: invoiceFileInfo,
          // Flag that no attachment is included but was intended
          attachmentOmitted: true,
          // Include raw client data for easier debugging
          rawClient: {
            _id: client._id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            honorar: client.honorar,
            raten: client.raten,
            ratenStart: client.ratenStart,
            caseNumber: client.caseNumber
          },
          timestamp: new Date().toISOString()
        };
        
        const response = await axios.post(MAKE_WEBHOOK_URL, simplePayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Last resort email succeeded:', response.status);
        return {
          success: true,
          makeResponse: response.data,
          sentTo: client.email,
          attachmentOmitted: true,
          warning: 'Email sent without attachment due to technical limitations'
        };
      } catch (lastResortError) {
        console.error('Last resort method also failed:', lastResortError);
      }
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// For backwards compatibility
export default {
  sendWelcomePortalEmail,
  generateClientPortalUrl,
  generateWelcomeEmailContent
};