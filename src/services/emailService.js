import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Configure nodemailer with environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
 * Send welcome email with payment and portal information
 * @param {Object} client - Client object with all data
 * @returns {Promise} Email sending result
 */
export async function sendWelcomePortalEmail(client) {
  // Format date for payment
  const formattedRatenStart = client.ratenStart || '01.01.2025';
  const honorarDisplay = client.honorar ? `${client.honorar}€` : 'den vereinbarten Betrag';
  const portalUrl = generateClientPortalUrl(client);
  const ratenValue = client.raten || 3;
  
  // Construct email HTML
  const htmlContent = `
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
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Rechtsanwaltskanzlei Scuric" <kontakt@schuldnerberatung-anwalt.de>',
    to: client.email,
    subject: `Ihr Mandantenportal und Zahlungsinformationen - ${client.caseNumber || 'Neue Mandatschaft'}`,
    html: htmlContent
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// For backwards compatibility
export default {
  sendWelcomePortalEmail,
  generateClientPortalUrl
};