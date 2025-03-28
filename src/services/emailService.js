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
  const baseUrl = process.env.CLIENT_PORTAL_BASE_URL || 'https://portal.scuric.de';
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
    <div style="padding: 15px; margin-top: 20px; background-color: #f2f7ff; border-radius: 10px; border: 1px solid #d1e0ff;">
      <p style="font-weight: bold; color: #324ca8;">Rechnungsinformationen:</p>
      <p>Rechnungsnummer: ${invoiceData.invoiceNumber || '-'}</p>
      <p>Rechnungsdatum: ${invoiceData.date || new Date().toLocaleDateString('de-DE')}</p>
      <p>Betrag: ${invoiceData.amount || client.honorar || 1111}€</p>
      <p>Zahlbar bis: ${invoiceData.dueDate || ''}</p>
      <p>Die Rechnung ist dieser E-Mail als Anhang beigefügt.</p>
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
  <p class="greeting">Sehr geehrte(r) ${client.name},</p>

  <p class="spacing">zunächst einmal vielen Dank für Ihr Vertrauen und die Erteilung des Mandats. Wir freuen uns, Sie auf Ihrem Weg in eine schuldenfreie Zukunft begleiten zu dürfen.</p>

  <p class="spacing">Wie vereinbart beträgt unser Gesamthonorar pauschal ${honorarDisplay} (inkl. 19% MwSt.), welches Sie in ${ratenValue} Raten bezahlen können.</p>

  <p>Um mit dem Schreiben an Ihre Gläubiger beginnen zu können, bitten wir Sie, die erste Rate bis zum <span class="important">${formattedRatenStart}</span> zu überweisen. Nach Zahlungseingang nehmen wir umgehend Kontakt mit Ihren Gläubigern auf.</p>

  <p class="spacing">Für eine erfolgreiche Zusammenarbeit haben wir ein persönliches Mandantenportal für Sie eingerichtet. Dort können Sie Ihre Gläubigerschreiben hochladen und den Fortschritt Ihres Verfahrens einsehen.</p>

  <p>Ihr <span class="important">persönliches Aktenzeichen</span> lautet: <span class="important">${client.caseNumber || 'Wird in Kürze vergeben'}</span></p>

  <p>Bitte nutzen Sie dieses Aktenzeichen für Ihren Zugang zum Mandantenportal:</p>
  <div class="button-container">
    <a href="${portalUrl}" class="button">-> Zum Mandantenportal <-</a>
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
      dueDate: invoiceData.dueDate || ''
    } : null;

    // Create portal URL for the client
    const portalUrl = generateClientPortalUrl(client);

    // Create data payload for Make.com
    const makeData = {
      client: clientData,
      portalUrl: portalUrl,
      invoice: invoiceDetails,
      attachment: invoiceBase64 ? {
        fileName: fileName,
        fileType: fileType,
        base64Content: invoiceBase64
      } : null
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
        // Simplified payload without attachment
        const clientData = {
          id: client._id,
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || ''
        };
        
        const simplePayload = {
          client: clientData,
          portalUrl: generateClientPortalUrl(client),
          invoice: invoiceData ? {
            invoiceNumber: invoiceData.invoiceNumber || '',
            date: invoiceData.date || new Date().toLocaleDateString('de-DE')
          } : null,
          // Flag that no attachment is included but was intended
          attachmentOmitted: true 
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