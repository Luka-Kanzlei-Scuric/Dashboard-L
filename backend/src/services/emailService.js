import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP Configuration - Using environment variables for security
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Generate a secure token for client authentication
 * @param {Object} client - Client object with id and other details
 * @param {String} purpose - Purpose of the token (e.g., "upload", "verification")
 * @returns {String} - JWT token
 */
const generateSecureToken = (client, purpose) => {
  // The token will expire in 7 days (can be adjusted based on requirements)
  const expiresIn = '7d';
  
  return jwt.sign(
    { 
      id: client._id,
      email: client.email,
      purpose: purpose
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate a secure link for clients to upload documents
 * @param {Object} client - Client object
 * @returns {String} - Secure URL for document upload
 */
const generateSecureUploadLink = (client) => {
  const token = generateSecureToken(client, 'document-upload');
  const baseUrl = process.env.FRONTEND_URL || 'https://dashboard-l.vercel.app';
  
  return `${baseUrl}/upload/${token}`;
};

/**
 * Send an invoice to a client via email
 * @param {Object} client - Client object with contact information
 * @param {Object} invoiceData - Invoice details including amount, due date, etc.
 * @param {String} invoiceFilePath - Path to the invoice PDF
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendInvoiceEmail = async (client, invoiceData, invoiceFilePath) => {
  // Construct a professional email body with Apple-inspired design
  const emailBody = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ihre Rechnung</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f5f5f7;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #000000;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          background-color: #f5f5f7;
          color: #86868b;
          padding: 16px 24px;
          text-align: center;
          font-size: 12px;
        }
        h1 {
          margin: 0;
          font-weight: 600;
          font-size: 24px;
        }
        .button {
          display: inline-block;
          background-color: #0071e3;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 18px;
          font-weight: 500;
          margin-top: 16px;
          margin-bottom: 8px;
          text-align: center;
        }
        .invoice-details {
          background-color: #f5f5f7;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .invoice-details p {
          margin: 8px 0;
        }
        .signature {
          margin-top: 32px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Scuric Rechtsanwälte</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte(r) ${client.name},</p>
          
          <p>anbei erhalten Sie Ihre Rechnung für unsere Rechtsdienstleistungen.</p>
          
          <div class="invoice-details">
            <p><strong>Rechnungsnummer:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>Datum:</strong> ${invoiceData.date}</p>
            <p><strong>Betrag:</strong> ${invoiceData.amount} €</p>
            <p><strong>Fälligkeitsdatum:</strong> ${invoiceData.dueDate}</p>
          </div>
          
          <p>Die Rechnung finden Sie als Anhang zu dieser E-Mail. Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
          
          <p>Mit dieser Rechnung bitten wir Sie, die monatlichen Ratenzahlungen zu beginnen. Bitte laden Sie die Schreiben Ihrer Gläubiger hoch, damit wir mit der Arbeit starten können.</p>
          
          <a href="${generateSecureUploadLink(client)}" class="button">Gläubigerschreiben hochladen</a>
          
          <div class="signature">
            <p>Mit freundlichen Grüßen,</p>
            <p>Ihr Team von Scuric Rechtsanwälte</p>
          </div>
        </div>
        <div class="footer">
          <p>Scuric Rechtsanwälte GmbH &bull; Musterstraße 123 &bull; 10115 Berlin</p>
          <p>Tel: +49 30 1234567 &bull; E-Mail: kontakt@scuric-rechtsanwaelte.de</p>
          <p>&copy; ${new Date().getFullYear()} Scuric Rechtsanwälte. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Email configuration
  const mailOptions = {
    from: `"Scuric Rechtsanwälte" <${process.env.SMTP_USER}>`,
    to: client.email,
    subject: `Ihre Rechnung (${invoiceData.invoiceNumber})`,
    html: emailBody,
    attachments: [
      {
        filename: `Rechnung_${invoiceData.invoiceNumber}.pdf`,
        path: invoiceFilePath
      }
    ]
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${client.email}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

/**
 * Send a document upload request to a client
 * @param {Object} client - Client object with contact information
 * @param {String} documentType - Type of document requested (e.g., "Gläubigerschreiben")
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendDocumentUploadRequestEmail = async (client, documentType) => {
  // Generate secure upload link
  const uploadLink = generateSecureUploadLink(client);
  
  // Construct email body with Apple-inspired design
  const emailBody = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dokumente hochladen</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f5f5f7;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #000000;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          background-color: #f5f5f7;
          color: #86868b;
          padding: 16px 24px;
          text-align: center;
          font-size: 12px;
        }
        h1 {
          margin: 0;
          font-weight: 600;
          font-size: 24px;
        }
        .button {
          display: inline-block;
          background-color: #0071e3;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 18px;
          font-weight: 500;
          margin-top: 16px;
          margin-bottom: 8px;
          text-align: center;
        }
        .info-box {
          background-color: #f5f5f7;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .signature {
          margin-top: 32px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Scuric Rechtsanwälte</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte(r) ${client.name},</p>
          
          <p>für die weitere Bearbeitung Ihres Falles benötigen wir folgende Dokumente von Ihnen:</p>
          
          <div class="info-box">
            <p><strong>${documentType}</strong></p>
            <p>Diese sind wichtig für den weiteren Verlauf Ihres Verfahrens.</p>
          </div>
          
          <p>Über den folgenden Link können Sie die Dokumente sicher und einfach hochladen:</p>
          
          <a href="${uploadLink}" class="button">Dokumente hochladen</a>
          
          <p><small>Dieser Link ist persönlich und 7 Tage gültig. Bitte teilen Sie ihn nicht mit anderen Personen.</small></p>
          
          <div class="signature">
            <p>Mit freundlichen Grüßen,</p>
            <p>Ihr Team von Scuric Rechtsanwälte</p>
          </div>
        </div>
        <div class="footer">
          <p>Scuric Rechtsanwälte GmbH &bull; Musterstraße 123 &bull; 10115 Berlin</p>
          <p>Tel: +49 30 1234567 &bull; E-Mail: kontakt@scuric-rechtsanwaelte.de</p>
          <p>&copy; ${new Date().getFullYear()} Scuric Rechtsanwälte. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Email configuration
  const mailOptions = {
    from: `"Scuric Rechtsanwälte" <${process.env.SMTP_USER}>`,
    to: client.email,
    subject: `Bitte laden Sie Ihre ${documentType} hoch`,
    html: emailBody
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Document upload request email sent to ${client.email}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, uploadLink };
  } catch (error) {
    console.error('Error sending document upload request email:', error);
    throw error;
  }
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

// Export email service functions
export default {
  sendInvoiceEmail,
  sendDocumentUploadRequestEmail,
  generateSecureUploadLink,
  verifyToken
};