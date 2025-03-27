const Client = require('../models/Client');
const { generateClientPortalUrl, sendWelcomePortalEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ lastUpdated: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    const savedClient = await client.save();
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client phase
exports.updateClientPhase = async (req, res) => {
  try {
    const { phase } = req.body;
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    client.currentPhase = phase;
    
    // Add timestamp for phase completion
    client.phaseCompletionDates.set(phase.toString(), new Date());
    
    await client.save();
    res.status(200).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send welcome portal email
exports.sendWelcomeEmail = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const result = await sendWelcomePortalEmail(client);
    
    if (result.success) {
      // Update client email status
      client.emailSent = true;
      await client.save();
      
      res.status(200).json({ 
        message: 'Welcome email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send welcome email', 
        error: result.error 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get client portal URL
exports.getClientPortalUrl = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const portalUrl = generateClientPortalUrl(client);
    
    res.status(200).json({ 
      portalUrl,
      caseNumber: client.caseNumber || 'Pending'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};