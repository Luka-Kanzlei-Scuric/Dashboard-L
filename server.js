import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import connectDB from './src/config/db.js';
import Client from './src/models/Client.js';

// Config
dotenv.config();
const app = express();

// Middleware with enhanced CORS configuration
app.use(cors({
  origin: ['https://dashboard.scuric.de', 'https://portal.scuric.de', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Also handle OPTIONS requests for CORS preflight
app.options('*', cors());

app.use(express.json({ limit: '50mb' })); // Increased limit for larger attachments

// Connect to MongoDB
connectDB();

// Queue for changes that need to be sent to ClickUp via Make.com
const changeQueue = [];

// Process ClickUp data coming from Make.com
const processClickUpData = async (tasks) => {
  try {
    console.log('Processing ClickUp data...');
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
    
    // Process each task and add/update in the database
    for (const task of tasks) {
      try {
        // Extract client data from the task
        let email = '';
        let phone = '';
        
        if (task.custom_fields) {
          for (const field of task.custom_fields) {
            if (field.name.toLowerCase() === 'email') {
              email = field.value || '';
            }
            if (field.name.toLowerCase() === 'phone' || field.name.toLowerCase() === 'telefon') {
              phone = field.value || '';
            }
          }
        }
        
        // Skip if we don't have enough information
        if (!email || !phone) {
          console.log(`Skipping task ${task.id}: Missing email or phone`);
          results.skipped++;
          continue;
        }
        
        // Check if client already exists
        const existingClient = await Client.findOne({ clickupId: task.id });
        
        if (existingClient) {
          // Update existing client
          existingClient.name = task.name;
          existingClient.email = email;
          existingClient.phone = phone;
          existingClient.status = task.status?.status || 'Onboarding';
          existingClient.lastUpdated = new Date();
          
          await existingClient.save();
          console.log(`Updated client: ${task.name}`);
          results.updated++;
        } else {
          // Create new client
          const newClient = new Client({
            name: task.name,
            email: email,
            phone: phone,
            clickupId: task.id,
            status: task.status?.status || 'Onboarding',
            lastUpdated: new Date()
          });
          
          await newClient.save();
          console.log(`Added new client: ${task.name}`);
          results.added++;
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        results.errors++;
      }
    }
    
    console.log('ClickUp data processing completed', results);
    return { 
      success: true, 
      message: 'Data processed successfully', 
      stats: results 
    };
  } catch (error) {
    console.error('Error processing ClickUp data:', error.message);
    return { success: false, message: error.message };
  }
};

// Get pending changes for Make.com to sync to ClickUp
const getPendingChanges = () => {
  // Return a copy of changes and clear the queue
  const changes = [...changeQueue];
  changeQueue.length = 0; // Clear the queue
  return changes;
};

// Add client change to the queue for Make.com to process
const queueClientChange = (clientData, changeType) => {
  changeQueue.push({
    client: clientData,
    changeType: changeType,
    timestamp: new Date().toISOString()
  });
};

// API ROUTES

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single client by ID
app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new client
app.post('/api/clients', async (req, res) => {
  try {
    const newClient = new Client(req.body);
    await newClient.save();
    
    // Queue this change for Make.com to sync to ClickUp
    queueClientChange(newClient, 'create');
    
    res.status(201).json(newClient);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update a client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Queue this change for Make.com to sync to ClickUp
    queueClientChange(client, 'update');
    
    res.json(client);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    
    // Queue this deletion for Make.com to sync to ClickUp
    queueClientChange(client, 'delete');
    
    res.json({ success: true, message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// WEBHOOK ENDPOINTS

// Webhook endpoint for Make.com to send ClickUp data to our system
app.post('/api/webhook/clickup-to-dashboard', async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format. Expected tasks array.'
      });
    }
    
    const result = await processClickUpData(tasks);
    
    res.status(200).json({
      success: true,
      message: result.message,
      stats: result.stats
    });
  } catch (error) {
    console.error('Error in webhook processing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Webhook endpoint for Make.com to get changes from our system to sync to ClickUp
app.get('/api/webhook/dashboard-to-clickup', (req, res) => {
  try {
    const changes = getPendingChanges();
    res.status(200).json({
      success: true,
      count: changes.length,
      changes: changes
    });
  } catch (error) {
    console.error('Error providing changes for ClickUp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DIREKTER AIRCALL ENDPUNKT - Optimierte Implementation basierend auf cURL-Beispiel
app.post('/api/direct-aircall', async (req, res) => {
  try {
    // Log Request Details
    console.log('Received direct-aircall request:');
    console.log('- Body:', req.body);
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      console.error('❌ Keine Telefonnummer angegeben!');
      return res.status(400).json({
        success: false,
        message: 'Telefonnummer ist erforderlich'
      });
    }
    
    console.log(`⚡ Direkte Aircall-Anfrage für Nummer: ${phoneNumber}`);
    
    // Aircall API Konfiguration - exakt wie im cURL-Beispiel
    const apiAuth = 'Basic NzQxYTMyYzRhYjM0ZDQ3YTJkMmRkOTI5ZWZiZmI5MjU6MDkwYWFmZjRlY2U5YzA1MDcxNWVmNThiZDM4ZDE0OWQ=';
    const AIRCALL_USER_ID = '1527216';
    const AIRCALL_NUMBER_ID = '967647';
    
    try {
      console.log('=== EXAKTER AIRCALL API AUFRUF WIE IM CURL-BEISPIEL ===');
      console.log(`curl --location 'https://api.aircall.io/v1/users/${AIRCALL_USER_ID}/calls' \\
--header 'Authorization: ${apiAuth}' \\
--form 'number_id="${AIRCALL_NUMBER_ID}"' \\
--form 'to="${phoneNumber}"'`);
      
      // 1. PRIMÄRER ANSATZ: Genau wie im cURL Beispiel mit FormData
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('number_id', AIRCALL_NUMBER_ID);
      formData.append('to', phoneNumber);
      
      console.log('Sende Anfrage mit FormData an Aircall API...');
      
      const response = await axios({
        method: 'post',
        url: `https://api.aircall.io/v1/users/${AIRCALL_USER_ID}/calls`,
        data: formData,
        headers: {
          'Authorization': apiAuth,
          // FormData setzt automatisch den richtigen Content-Type mit Boundary
        }
      });
      
      // Aircall gibt 204 No Content zurück bei Erfolg, oder 200 mit Daten
      console.log('✅ Aircall API Response:', response.status);
      
      if (response.status === 204 || response.status === 200) {
        console.log('✅ Anruf erfolgreich initiiert!');
        
        return res.status(200).json({
          success: true,
          message: 'Anruf erfolgreich initiiert',
          callId: `call-${Date.now()}`,
          aircallResponse: response.data || { status: 'initiated' }
        });
      } else {
        console.warn('⚠️ Unerwarteter Statuscode:', response.status);
        throw new Error(`Unerwarteter Statuscode: ${response.status}`);
      }
    } catch (aircallError) {
      console.error('❌ Fehler bei Aircall API Anfrage:');
      console.error('- Status:', aircallError.response?.status);
      console.error('- Daten:', aircallError.response?.data);
      console.error('- Nachricht:', aircallError.message);
      
      // 2. ALTERNATIVER ANSATZ: Falls der erste fehlschlägt - exakt identisch mit Form-Data nur debugbarer
      try {
        console.log('⚠️ Versuche alternativen Ansatz mit explizitem form-data boundary...');
        
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('number_id', AIRCALL_NUMBER_ID);
        formData.append('to', phoneNumber);
        
        const formHeaders = formData.getHeaders();
        console.log('FormData Headers:', formHeaders);
        
        const alternativeResponse = await axios({
          method: 'post',
          url: `https://api.aircall.io/v1/users/${AIRCALL_USER_ID}/calls`,
          data: formData,
          headers: {
            ...formHeaders,
            'Authorization': apiAuth
          }
        });
        
        console.log('✅ Alternative Aircall API Response:', alternativeResponse.status);
        
        return res.status(200).json({
          success: true,
          message: 'Anruf erfolgreich initiiert (alternativer Ansatz)',
          callId: `call-${Date.now()}`
        });
      } catch (alternativeError) {
        console.error('❌ Auch alternativer Ansatz fehlgeschlagen:');
        console.error('- Status:', alternativeError.response?.status);
        console.error('- Daten:', alternativeError.response?.data);
        
        // 3. LETZTER VERSUCH: Versuche JSON falls alle form-data Ansätze fehlschlagen
        try {
          console.log('⚠️ Letzter Versuch mit JSON-Daten statt FormData...');
          
          const jsonResponse = await axios({
            method: 'post',
            url: `https://api.aircall.io/v1/users/${AIRCALL_USER_ID}/calls`,
            data: {
              number_id: AIRCALL_NUMBER_ID,
              to: phoneNumber
            },
            headers: {
              'Authorization': apiAuth,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ JSON Aircall API Response:', jsonResponse.status);
          
          return res.status(200).json({
            success: true,
            message: 'Anruf erfolgreich initiiert (JSON-Ansatz)',
            callId: `call-${Date.now()}`
          });
        } catch (jsonError) {
          console.error('❌ Alle API-Ansätze fehlgeschlagen!');
          
          return res.status(500).json({
            success: false,
            message: 'Fehler beim Starten des Anrufs - alle Ansätze fehlgeschlagen',
            error: {
              formData: aircallError.response?.data || aircallError.message,
              alternativeFormData: alternativeError.response?.data || alternativeError.message,
              json: jsonError.response?.data || jsonError.message
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Allgemeiner Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Serverfehler',
      error: error.message
    });
  }
});

// Test make.com webhook endpoint
app.get('/api/test-make-webhook', async (req, res) => {
  try {
    // Import axios if needed
    const axios = (await import('axios')).default;
    
    // Define the webhook URL
    const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki';
    
    // Send a comprehensive test payload with all required fields including invoice URL
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test message from the dashboard backend',
      client: {
        id: 'test-client-id',
        name: 'Test Mandant',
        email: 'test@example.com',
        phone: '+49 123 4567890',
        honorar: '1111',
        raten: 3,
        ratenStart: '01.01.2025',
        caseNumber: 'TEST-2025'
      },
      portalUrl: 'https://portal.scuric.de/portal/test-client-id',
      invoice: {
        invoiceNumber: 'INV-TEST-2025',
        date: new Date().toLocaleDateString('de-DE'),
        amount: '1111',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
      },
      // Add real PDF URL - will be used to link to the actual invoice
      invoiceURL: 'https://dashboard-l-backend.onrender.com/uploads/clients/test-client-id/invoice-test.pdf',
      // Include file metadata
      invoiceFile: {
        fileName: 'Rechnung-TEST-2025.pdf',
        fileSize: '125000',
        mimeType: 'application/pdf'
      }
    };
    
    // Send the request
    console.log('Sending test request to make.com webhook:', MAKE_WEBHOOK_URL);
    const response = await axios.post(MAKE_WEBHOOK_URL, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Make.com webhook test response:', response.status, response.data);
    
    // Return success to client
    res.status(200).json({
      success: true,
      message: 'Test message successfully sent to make.com webhook',
      webhookResponse: response.data
    });
  } catch (error) {
    console.error('Error testing make.com webhook:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error testing make.com webhook',
      error: error.message
    });
  }
});

// Email routes - Send welcome email data to Make.com
app.post('/api/clients/:id/email/welcome', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Extract invoice data from request body if available
    const invoiceData = req.body.invoiceData || null;
    
    // Import emailService dynamically
    const { sendWelcomePortalEmail } = await import('./src/services/emailService.js');
    
    // Call updated email function that sends data to Make.com
    const result = await sendWelcomePortalEmail(client, invoiceData);
    
    if (result.success) {
      // Update client to mark email as sent
      client.emailSent = true;
      client.lastEmailSent = new Date();
      await client.save();
      
      // Queue this change for Make.com to sync to ClickUp
      queueClientChange(client, 'update');
      
      res.status(200).json({
        success: true,
        message: 'Email data sent to Make.com successfully',
        sentTo: result.sentTo,
        makeData: result.makeResponse
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email data to Make.com', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending email data to Make.com:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get client portal URL
app.get('/api/clients/:id/portal-url', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Import emailService dynamically
    const { generateClientPortalUrl } = await import('./src/services/emailService.js');
    
    const portalUrl = generateClientPortalUrl(client);
    
    res.status(200).json({ 
      success: true,
      portalUrl,
      caseNumber: client.caseNumber || 'Pending'
    });
  } catch (error) {
    console.error('Error generating portal URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate email preview and prepare Make.com data
app.post('/api/clients/:id/generate-email-preview', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    // Extract invoice data from request body if available
    const invoiceData = req.body.invoiceData || null;
    
    // Import emailService dynamically
    const { generateWelcomeEmailContent, generateClientPortalUrl } = await import('./src/services/emailService.js');
    
    // Generate HTML content of the email for preview
    const html = generateWelcomeEmailContent(client, invoiceData);
    
    // Also prepare the data structure that will be sent to Make.com
    // This helps frontend understand what data will be sent
    const portalUrl = generateClientPortalUrl(client);
    
    const makeData = {
      client: {
        id: client._id,
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        honorar: client.honorar || '',
        raten: client.raten || 3,
        ratenStart: client.ratenStart || '01.01.2025',
        caseNumber: client.caseNumber || 'Wird in Kürze vergeben'
      },
      portalUrl: portalUrl,
      invoice: invoiceData ? {
        invoiceNumber: invoiceData.invoiceNumber || '',
        date: invoiceData.date || new Date().toLocaleDateString('de-DE'),
        amount: invoiceData.amount || client.honorar || '',
        dueDate: invoiceData.dueDate || ''
      } : null,
      // No attachment data here since we don't want to send the full base64 in the preview
      hasAttachment: !!(invoiceData && invoiceData.filePath)
    };
    
    res.status(200).json({
      success: true,
      html,
      makeData
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});