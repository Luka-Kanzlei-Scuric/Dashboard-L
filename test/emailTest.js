// Email Test Script
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * This script allows testing the email functionality
 * without having to go through the entire application.
 * 
 * Usage:
 * 1. Make sure you have set the EMAIL_* environment variables in your .env file
 * 2. Run this script with node -r esm test/emailTest.js
 * 3. Check your email to see if you received the test email
 */

// Create a test SMTP transporter for email testing
const createTestTransporter = () => {
  // Either use the configured email settings or use ethereal test credentials
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Using configured email settings.');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log('No email configuration found, using ethereal email for testing.');
    // Create a test account at ethereal.email for testing
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount()
        .then(testAccount => {
          const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          resolve(transporter);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
};

/**
 * Generate a test email for a client
 * @param {Object} client - Client data
 * @returns {Object} Email options
 */
const generateTestEmail = (client) => {
  const clientData = {
    name: client.name || 'Test Client',
    email: client.email || 'test@example.com',
    honorar: client.honorar || 1111,
    raten: client.raten || 3,
    ratenStart: client.ratenStart || '01.01.2025',
    caseNumber: client.caseNumber || 'TEST-1234'
  };

  const portalUrl = `https://portal.example.com/portal/${clientData.caseNumber}`;
  
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
  <p class="greeting">Sehr geehrte(r) ${clientData.name},</p>

  <p class="spacing">zunächst einmal vielen Dank für Ihr Vertrauen und die Erteilung des Mandats. Wir freuen uns, Sie auf Ihrem Weg in eine schuldenfreie Zukunft begleiten zu dürfen.</p>

  <p class="spacing">Wie vereinbart beträgt unser Gesamthonorar pauschal ${clientData.honorar}€ (inkl. 19% MwSt.), welches Sie in ${clientData.raten} Raten bezahlen können.</p>

  <p>Um mit dem Schreiben an Ihre Gläubiger beginnen zu können, bitten wir Sie, die erste Rate bis zum <span class="important">${clientData.ratenStart}</span> zu überweisen. Nach Zahlungseingang nehmen wir umgehend Kontakt mit Ihren Gläubigern auf.</p>

  <p class="spacing">Für eine erfolgreiche Zusammenarbeit haben wir ein persönliches Mandantenportal für Sie eingerichtet. Dort können Sie Ihre Gläubigerschreiben hochladen und den Fortschritt Ihres Verfahrens einsehen.</p>

  <p>Ihr <span class="important">persönliches Aktenzeichen</span> lautet: <span class="important">${clientData.caseNumber}</span></p>

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

  return {
    from: process.env.EMAIL_FROM || '"Rechtsanwaltskanzlei Scuric" <test@example.com>',
    to: process.env.TEST_EMAIL || clientData.email,
    subject: `Ihr Mandantenportal und Zahlungsinformationen - ${clientData.caseNumber}`,
    html: htmlContent
  };
};

/**
 * Main function to test sending an email
 */
const testEmailSending = async () => {
  try {
    // Create a test transporter
    const transporter = await createTestTransporter();

    // Test client data
    const testClient = {
      name: 'Max Mustermann',
      email: process.env.TEST_EMAIL || 'test@example.com',
      honorar: 1111,
      raten: 3,
      ratenStart: '01.01.2025',
      caseNumber: 'TEST-1234'
    };

    // Generate the test email
    const mailOptions = generateTestEmail(testClient);

    console.log('Sending test email...');
    console.log(`From: ${mailOptions.from}`);
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);

    // If using ethereal, print the URL to view the message
    if (info.messageUrl) {
      console.log('Preview URL:', info.messageUrl);
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

// Run the test
testEmailSending().catch(console.error);