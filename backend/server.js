import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import connectDB from './src/config/db.js';
import Client from './src/models/Client.js';
import emailService from './src/services/emailService.js';
import fileService from './src/services/fileService.js';

// Load env variables
dotenv.config();

// Init express
const app = express();

// Connect to database with retry mechanism
(async function connectWithRetry() {
  console.log('Attempting to connect to MongoDB...');
  
  try {
    await connectDB();
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
})();

// CORS configuration - Always allow dashboard domain in any environment
const allowedOrigins = [
  'https://dashboard-l.onrender.com',
  'https://dashboard-l.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Add origins from environment variable if available
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','));
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Temporarily allow all origins while debugging
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Debug CORS settings
console.log('CORS settings:', {
  environment: process.env.NODE_ENV || 'development',
  allowedOrigins
});

// Special preflight handler - respond to all OPTIONS requests immediately
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Cache-Control, Pragma, X-Random');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight response
    console.log(`Handled preflight request from ${req.headers.origin} for ${req.path}`);
    return res.status(204).send();
  }
  next();
});

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests (additional dedicated handler)
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(fileService.uploadsBaseDir));

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
        
        // Handle custom_fields as array (from custom_fields_original)
        if (Array.isArray(task.custom_fields)) {
          for (const field of task.custom_fields) {
            if (field.name && field.name.toLowerCase() === 'email') {
              email = field.value || '';
            }
            if (field.name && (field.name.toLowerCase() === 'phone' || field.name.toLowerCase() === 'telefon' || field.name.toLowerCase() === 'telefonnummer')) {
              phone = field.value || '';
            }
          }
        } 
        // Handle custom_fields as object (direct from ClickUp API)
        else if (typeof task.custom_fields === 'object' && task.custom_fields !== null) {
          // Try to find email and phone in the object
          if (task.custom_fields.Email) {
            email = task.custom_fields.Email;
          }
          if (task.custom_fields.Phone || task.custom_fields.Telefon || task.custom_fields.Telefonnummer) {
            phone = task.custom_fields.Phone || task.custom_fields.Telefon || task.custom_fields.Telefonnummer;
          }
        }
        
        // Try to get from custom_fields_original if still no email/phone
        if ((!email || !phone) && task.custom_fields_original && Array.isArray(task.custom_fields_original)) {
          for (const field of task.custom_fields_original) {
            if (field.name && field.name.toLowerCase() === 'email') {
              email = field.value || '';
            }
            if (field.name && (field.name.toLowerCase() === 'phone' || field.name.toLowerCase() === 'telefon' || field.name.toLowerCase() === 'telefonnummer')) {
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
    console.log('GET /api/clients request received from:', req.headers.origin);
    
    // Add delay for debugging, can be removed later
    // This is just to see if the request is getting stuck or timing out
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clients = await Client.find({}).sort({ createdAt: -1 });
    
    console.log(`Returning ${clients.length} clients`);
    
    // If no clients found, return empty array instead of null
    res.json(clients || []);
  } catch (error) {
    console.error('Error fetching clients:', error);
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
    console.log(`Updating client ${req.params.id} with data:`, req.body);
    
    // Prüfe auf Honorardaten, da diese nun im Schema existieren
    if (req.body.honorar !== undefined) {
      console.log(`Client update includes honorar: ${req.body.honorar}`);
    }
    
    // Handle phase changes
    const updateData = { ...req.body };
    
    // If currentPhase is updated, add timestamp for phase completion
    if (updateData.currentPhase) {
      const phaseNumber = updateData.currentPhase;
      console.log(`Updating client phase to ${phaseNumber}`);
      
      // Get the current client to access existing phase data
      const existingClient = await Client.findById(req.params.id);
      if (!existingClient) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      
      // Only add timestamp if this is a new phase completion
      const phaseCompletionDates = existingClient.phaseCompletionDates || new Map();
      if (!phaseCompletionDates.has(phaseNumber.toString())) {
        phaseCompletionDates.set(phaseNumber.toString(), new Date());
        updateData.phaseCompletionDates = phaseCompletionDates;
        console.log(`Added timestamp for phase ${phaseNumber} completion`);
      }
      
      // Update status based on phase
      if (phaseNumber >= 3 && existingClient.status !== 'Aktiv') {
        updateData.status = 'Aktiv';
        console.log(`Updated client status to Aktiv due to phase change`);
      }
    }
    
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    console.log(`Client updated successfully:`, {
      id: client._id,
      name: client.name,
      honorar: client.honorar,
      raten: client.raten,
      ratenStart: client.ratenStart,
      currentPhase: client.currentPhase,
      status: client.status
    });
    
    // Queue this change for Make.com to sync to ClickUp
    queueClientChange(client, 'update');
    
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
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
app.get('/api/health', cors(corsOptions), (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header'
  });
});

// Send invoice to client
app.post('/api/clients/:id/send-invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceData, invoiceFilePath } = req.body;
    
    if (!invoiceData || !invoiceFilePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invoice data and file path are required' 
      });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    const result = await emailService.sendInvoiceEmail(client, invoiceData, invoiceFilePath);
    
    res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send document upload request to client
app.post('/api/clients/:id/request-documents', async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!documentType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document type is required' 
      });
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    const result = await emailService.sendDocumentUploadRequestEmail(client, documentType);
    
    res.status(200).json({
      success: true,
      message: 'Document upload request email sent successfully',
      uploadLink: result.uploadLink
    });
  } catch (error) {
    console.error('Error sending document upload request email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify upload token
app.get('/api/verify-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }
    
    const decodedToken = emailService.verifyToken(token);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Optional: Get client info to provide context
    const client = await Client.findById(decodedToken.id);
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    
    res.status(200).json({
      success: true,
      clientId: client._id,
      clientName: client.name,
      purpose: decodedToken.purpose
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload an invoice for a client
app.post('/api/clients/:id/upload-invoice', fileService.upload.single('invoice'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
    }
    
    // Check if client exists
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Mandant nicht gefunden' });
    }
    
    // Move file from temp to client-specific directory
    const filePath = fileService.moveFileToClientDir(id, req.file.filename);
    
    // Create document record
    const document = {
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      path: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      documentType: 'invoice',
      uploadDate: new Date()
    };
    
    // Add document to client's documents array
    client.documents.push(document);
    
    // Set the current invoice reference to this document's ID
    client.currentInvoice = client.documents[client.documents.length - 1]._id;
    
    // Save client with new document
    await client.save();
    
    // Return success response with file details
    res.status(200).json({
      success: true,
      message: 'Rechnung erfolgreich hochgeladen',
      document: {
        id: client.documents[client.documents.length - 1]._id,
        filename: document.filename,
        originalFilename: document.originalFilename,
        path: filePath,
        url: `/uploads/${filePath}`,
        size: document.size,
        mimetype: document.mimetype,
        documentType: document.documentType,
        uploadDate: document.uploadDate
      }
    });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload documents for a client (used by client via token)
app.post('/api/upload-documents', fileService.upload.array('documents', 10), async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token ist erforderlich' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Keine Dateien hochgeladen' });
    }
    
    // Verify token
    const decodedToken = emailService.verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Ungültiger oder abgelaufener Token' });
    }
    
    // Get client
    const client = await Client.findById(decodedToken.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Mandant nicht gefunden' });
    }
    
    // Process each uploaded file
    const uploadedDocuments = [];
    for (const file of req.files) {
      // Move file from temp to client directory
      const filePath = fileService.moveFileToClientDir(client._id, file.filename);
      
      // Create document record
      const document = {
        filename: file.filename,
        originalFilename: file.originalname,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype,
        documentType: 'creditorLetter',
        uploadDate: new Date()
      };
      
      // Add document to client's documents array
      client.documents.push(document);
      
      // Add to response array
      uploadedDocuments.push({
        id: client.documents[client.documents.length - 1]._id,
        filename: document.filename,
        originalFilename: document.originalFilename,
        url: `/uploads/${filePath}`
      });
    }
    
    // Mark documents as uploaded
    client.documentsUploaded = true;
    
    // Save client with new documents
    await client.save();
    
    res.status(200).json({
      success: true,
      message: `${req.files.length} Dokumente erfolgreich hochgeladen`,
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all documents for a client
app.get('/api/clients/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get client with all documents
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Mandant nicht gefunden' });
    }
    
    // Map documents to add URLs
    const documents = client.documents.map(doc => ({
      id: doc._id,
      filename: doc.filename,
      originalFilename: doc.originalFilename,
      path: doc.path,
      url: `/uploads/${doc.path}`,
      size: doc.size,
      mimetype: doc.mimetype,
      documentType: doc.documentType,
      uploadDate: doc.uploadDate
    }));
    
    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error getting client documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a document
app.delete('/api/clients/:clientId/documents/:documentId', async (req, res) => {
  try {
    const { clientId, documentId } = req.params;
    
    // Get client with documents
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Mandant nicht gefunden' });
    }
    
    // Find the document in the client's documents array
    const documentIndex = client.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Dokument nicht gefunden' });
    }
    
    // Get document to delete
    const documentToDelete = client.documents[documentIndex];
    
    // Delete file from disk
    fileService.deleteFile(documentToDelete.path);
    
    // Remove document from client's documents array
    client.documents.splice(documentIndex, 1);
    
    // If this was the current invoice, clear the reference
    if (client.currentInvoice && client.currentInvoice.toString() === documentId) {
      client.currentInvoice = null;
    }
    
    // If no documents of type 'creditorLetter' remain and documentsUploaded is true, set it to false
    const hasCreditorLetters = client.documents.some(doc => doc.documentType === 'creditorLetter');
    if (!hasCreditorLetters && client.documentsUploaded) {
      client.documentsUploaded = false;
    }
    
    // Save client
    await client.save();
    
    res.status(200).json({
      success: true,
      message: 'Dokument erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Basic route for testing
app.get('/', cors(corsOptions), (req, res) => {
  res.status(200).json({
    message: 'Scuric Dashboard API is running',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header'
  });
});

// Debug route to check CORS
app.get('/test-cors', cors(corsOptions), (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Test data endpoint for debugging
app.get('/api/test-data', cors(corsOptions), (req, res) => {
  console.log('GET /api/test-data request received from:', req.headers.origin);
  
  // Return sample data that can be used for testing
  res.status(200).json([
    {
      _id: 'test1',
      name: 'Test Client 1',
      email: 'test1@example.com',
      phone: '+49 123 456789',
      clickupId: 'test123456',
      status: 'Onboarding',
      lastUpdated: new Date().toISOString()
    },
    {
      _id: 'test2',
      name: 'Test Client 2',
      email: 'test2@example.com',
      phone: '+49 123 987654',
      clickupId: 'test654321',
      status: 'Aktiv',
      lastUpdated: new Date().toISOString()
    }
  ]);
});

// CORS proxy endpoint - helps with older browsers or edge cases
app.post('/cors-proxy', cors(corsOptions), async (req, res) => {
  try {
    const { url, method = 'GET', data = {}, headers = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    // Make the request using axios
    const response = await axios({
      url,
      method,
      data,
      headers: {
        ...headers,
        'User-Agent': 'Scuric-Dashboard-Backend-Proxy'
      },
      timeout: 10000
    });
    
    // Return the proxied response
    res.status(200).json({
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('CORS proxy error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
});

// Dedicated proxy endpoint for form data
app.get('/api/proxy/forms/:taskId', cors(corsOptions), async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task ID is required' 
      });
    }
    
    console.log(`Proxying form data request for task ID: ${taskId}`);
    
    // Versuche zuerst, wenn schon in der Datenbank gespeichert
    try {
      const cachedDataKey = `formData:${taskId}`;
      const client = await Client.findOne({ clickupId: taskId });
      
      // Wenn der Client gefunden wurde und wir bereits Daten im Cache haben
      if (client && client.formDataCache) {
        // Prüfe ob der Cache noch gültig ist (nicht älter als 1 Stunde)
        const cacheTime = client.formDataCacheTime || 0;
        const now = Date.now();
        const cacheAge = now - cacheTime;
        const cacheValidityPeriod = 60 * 60 * 1000; // 1 Stunde in Millisekunden
        
        if (cacheAge < cacheValidityPeriod) {
          console.log(`Using cached form data for client ${taskId}, cache age: ${cacheAge/1000/60} minutes`);
          return res.status(200).json(JSON.parse(client.formDataCache));
        } else {
          console.log(`Cache expired for client ${taskId}, fetching fresh data`);
        }
      }
    } catch (cacheError) {
      console.error('Error checking form data cache:', cacheError);
      // Continue with API request if cache check fails
    }
    
    // Make the request to the target API
    const targetUrl = `https://privatinsolvenz-backend.onrender.com/api/forms/${taskId}`;
    
    const response = await axios.get(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Scuric-Dashboard-Backend-Proxy',
        'Origin': 'https://dashboard-l.onrender.com' // Set allowed origin
      },
      timeout: 8000
    });
    
    // Speichere die Antwort im Cache
    try {
      const client = await Client.findOne({ clickupId: taskId });
      if (client) {
        client.formDataCache = JSON.stringify(response.data);
        client.formDataCacheTime = Date.now();
        await client.save();
        console.log(`Cached form data for client ${taskId}`);
      }
    } catch (cacheError) {
      console.error('Error caching form data:', cacheError);
    }
    
    // Return the proxied response
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Form data proxy error:', error.message);
    
    // Return fallback data if remote API fails
    if (error.response?.status === 404 || !error.response) {
      // Versuche zuerst, den Client aus der Datenbank zu laden
      try {
        const taskId = req.params.taskId;
        console.log(`Looking for client with clickupId: ${taskId} to use stored honorar data`);
        
        const client = await Client.findOne({ clickupId: taskId });
        
        // Prüfe zuerst auf Cache-Daten
        if (client && client.formDataCache) {
          console.log(`Using cached form data for client ${taskId} as fallback`);
          return res.status(200).json(JSON.parse(client.formDataCache));
        }
        
        // Wenn der Client gefunden wurde und Honorardaten hat, verwende diese
        if (client && (client.honorar || client.raten || client.ratenStart)) {
          console.log(`Found client with clickupId ${taskId}, using stored honorar data:`, {
            honorar: client.honorar,
            raten: client.raten,
            ratenStart: client.ratenStart
          });
          
          return res.status(200).json({
            name: client.name,
            honorar: client.honorar || 1111,
            raten: client.raten || 2,
            ratenStart: client.ratenStart || "01.01.2025",
            adresse: client.address || "Adresse nicht verfügbar",
            einwilligung: "Ja",
            vorfall: "Privatinsolvenz",
            nettoeinkommen: "Nicht verfügbar",
            _isFallback: true,
            _fromDatabase: true
          });
        }
      } catch (dbError) {
        console.error('Error fetching client data from database:', dbError);
      }
      
      // Falls kein Client gefunden wurde oder ein Fehler auftrat, verwende die Standard-Fallback-Daten
      return res.status(200).json({
        name: "Max Mustermann (Fallback)",
        honorar: 1111,
        raten: 2,
        ratenStart: "01.01.2025",
        adresse: "Musterstraße 123, 10115 Berlin",
        einwilligung: "Ja",
        vorfall: "Privatinsolvenz beantragt am 01.02.2025",
        schadensumme: "8.500 €",
        versicherung: "AllSecure AG",
        policeNummer: "VS-123456789",
        nettoeinkommen: "2.400 €",
        _isFallback: true
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});