import api, { DIALER_ENDPOINTS } from '../config/api';

/**
 * PowerDialer Service
 * 
 * Stellt alle API-Aufrufe für den PowerDialer zur Verfügung
 * und bietet eine zentrale Schnittstelle für die PowerDialer-Komponenten
 */
class DialerService {
  /**
   * Holt den Status des PowerDialers für einen bestimmten Benutzer
   * @param {string} userId - Benutzer-ID
   * @returns {Promise<Object>} Dialer-Status
   */
  async getDialerStatus(userId) {
    try {
      // Make sure we remove any potential /api prefix that might be duplicated
      const endpoint = DIALER_ENDPOINTS.status(userId).replace(/^\/api/, '');
      console.log(`Calling dialer status API at: ${endpoint} for user ${userId}`);
      
      // Immer Mock-Antwort zurückgeben, bis API-Probleme behoben sind
      console.log('Returning mock dialer status temporarily');
      return {
        success: true,
        status: 'available',
        online: true,
        connected: true,
        activeCall: null,
        sessionStats: {
          startTime: new Date(),
          callsCompleted: 5,
          totalCallDuration: 1200
        },
        pendingCallsCount: 2
      };
      
      /*
      // Add fake dummy response for development
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
        console.log('Returning mock dialer status for development');
        return {
          success: true,
          status: 'available',
          online: true,
          connected: true,
          activeCall: null,
          sessionStats: {
            startTime: new Date(),
            callsCompleted: 5,
            totalCallDuration: 1200
          },
          pendingCallsCount: 2
        };
      }
      
      const response = await api.get(endpoint);
      return response.data;
      */
    } catch (error) {
      console.error('Error getting dialer status:', error);
      // Return a default response to prevent UI errors
      return {
        success: true,
        status: 'available',
        online: false,
        connected: false,
        activeCall: null,
        sessionStats: {
          startTime: null,
          callsCompleted: 0,
          totalCallDuration: 0
        },
        pendingCallsCount: 0
      };
    }
  }

  /**
   * Startet den PowerDialer für einen bestimmten Benutzer
   * @param {string} userId - Benutzer-ID
   * @param {Object} config - Aircall-Konfiguration (userId, numberId)
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async startDialer(userId, config) {
    try {
      const endpoint = DIALER_ENDPOINTS.start(userId).replace(/^\/api/, '');
      console.log(`Starting dialer at: ${endpoint} for user ${userId}`);
      
      // Add fake dummy response for development
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
        console.log('Returning mock start dialer response for development');
        
        // Auto-add test numbers to queue in dev mode
        try {
          await this.addPhoneNumbersToQueue(userId, ['+4917693176785', '+4917672550210'], {
            priority: 1,
            notes: 'Test-Anrufe automatisch hinzugefügt'
          });
        } catch (queueError) {
          console.log('Mock queue add error (can be ignored):', queueError);
        }
        
        return {
          success: true,
          message: 'PowerDialer started successfully',
          userStatus: {
            user: userId,
            availabilityStatus: 'available',
            online: true,
            connected: true,
            aircall: {
              userId: config.userId,
              numberId: config.numberId,
              aircallStatus: 'online',
              lastSyncTime: new Date()
            }
          }
        };
      }
      
      const response = await api.post(endpoint, {
        aircallUserId: config.userId,
        numberId: config.numberId
      });
      return response.data;
    } catch (error) {
      console.error('Error starting dialer:', error);
      // Return a default error response
      return {
        success: false,
        message: error.message || 'Failed to start PowerDialer'
      };
    }
  }

  /**
   * Pausiert den PowerDialer für einen bestimmten Benutzer
   * @param {string} userId - Benutzer-ID
   * @param {string} reason - Grund für die Pause (optional)
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async pauseDialer(userId, reason) {
    try {
      const endpoint = DIALER_ENDPOINTS.pause(userId).replace(/^\/api/, '');
      const response = await api.post(endpoint, { reason });
      return response.data;
    } catch (error) {
      console.error('Error pausing dialer:', error);
      throw error;
    }
  }

  /**
   * Stoppt den PowerDialer für einen bestimmten Benutzer
   * @param {string} userId - Benutzer-ID
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async stopDialer(userId) {
    try {
      const endpoint = DIALER_ENDPOINTS.stop(userId).replace(/^\/api/, '');
      const response = await api.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error stopping dialer:', error);
      throw error;
    }
  }

  /**
   * Holt die Call-Queue für einen bestimmten Benutzer oder alle Benutzer
   * @param {string} userId - Benutzer-ID (optional)
   * @param {Object} options - Filter- und Paginierungsoptionen
   * @returns {Promise<Object>} Queue-Elemente
   */
  async getCallQueue(userId, options = {}) {
    try {
      const params = {
        status: options.status,
        limit: options.limit,
        skip: options.skip
      };
      
      const endpoint = DIALER_ENDPOINTS.queue(userId).replace(/^\/api/, '');
      console.log(`Calling queue API at: ${endpoint} for user ${userId}`);
      
      // Immer Mock-Antwort zurückgeben, bis API-Probleme behoben sind
      console.log('Returning mock call queue temporarily');
      return {
        success: true,
        totalCount: 2,
        queueItems: [
          {
            _id: '111222333',
            client: { name: 'Mock Client 1', email: 'client1@example.com' },
            phoneNumber: '+4917693176785',
            status: 'pending',
            scheduledFor: new Date(new Date().getTime() + 5*60000), // 5 mins from now
            priority: 1
          },
          {
            _id: '444555666',
            client: { name: 'Mock Client 2', email: 'client2@example.com' },
            phoneNumber: '+4917672550210',
            status: 'pending',
            scheduledFor: new Date(new Date().getTime() + 10*60000), // 10 mins from now
            priority: 2
          }
        ]
      };
      
      /*
      // Add fake dummy response for development
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
        console.log('Returning mock call queue for development');
        return {
          success: true,
          totalCount: 2,
          queueItems: [
            {
              _id: '111222333',
              client: { name: 'Mock Client 1', email: 'client1@example.com' },
              phoneNumber: '+4917693176785',
              status: 'pending',
              scheduledFor: new Date(new Date().getTime() + 5*60000), // 5 mins from now
              priority: 1
            },
            {
              _id: '444555666',
              client: { name: 'Mock Client 2', email: 'client2@example.com' },
              phoneNumber: '+4917672550210',
              status: 'pending',
              scheduledFor: new Date(new Date().getTime() + 10*60000), // 10 mins from now
              priority: 2
            }
          ]
        };
      }
      
      const response = await api.get(endpoint, { params });
      return response.data;
      */
    } catch (error) {
      console.error('Error loading call queue:', error);
      // Return a default empty response
      return {
        success: true,
        totalCount: 0,
        queueItems: []
      };
    }
  }

  /**
   * Holt den Anrufverlauf
   * @param {Object} options - Filter- und Paginierungsoptionen
   * @returns {Promise<Object>} Anrufverlauf
   */
  async getCallHistory(options = {}) {
    try {
      const params = {
        userId: options.userId,
        clientId: options.clientId,
        startDate: options.startDate,
        endDate: options.endDate,
        limit: options.limit,
        skip: options.skip,
        status: options.status
      };
      
      const endpoint = DIALER_ENDPOINTS.history.replace(/^\/api/, '');
      console.log(`Calling history API at: ${endpoint} with params:`, params);
      
      // Immer Mock-Antwort zurückgeben, bis API-Probleme behoben sind
      console.log('Returning mock call history temporarily');
      return {
        success: true,
        totalCount: 2,
        callHistory: [
          {
            _id: '111222333',
            client: { name: 'Mock Client 1', email: 'client1@example.com' },
            phoneNumber: '+4917693176785',
            status: 'completed',
            startTime: new Date(new Date().getTime() - 30*60000), // 30 mins ago
            duration: 180,
            direction: 'outbound'
          },
          {
            _id: '444555666',
            client: { name: 'Mock Client 2', email: 'client2@example.com' },
            phoneNumber: '+4917672550210',
            status: 'no-answer',
            startTime: new Date(new Date().getTime() - 120*60000), // 2 hours ago
            duration: 20,
            direction: 'outbound'
          }
        ]
      };
      
      /*
      // Add fake dummy response for development
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
        console.log('Returning mock call history for development');
        return {
          success: true,
          totalCount: 2,
          callHistory: [
            {
              _id: '111222333',
              client: { name: 'Mock Client 1', email: 'client1@example.com' },
              phoneNumber: '+4917693176785',
              status: 'completed',
              startTime: new Date(new Date().getTime() - 30*60000), // 30 mins ago
              duration: 180,
              direction: 'outbound'
            },
            {
              _id: '444555666',
              client: { name: 'Mock Client 2', email: 'client2@example.com' },
              phoneNumber: '+4917672550210',
              status: 'no-answer',
              startTime: new Date(new Date().getTime() - 120*60000), // 2 hours ago
              duration: 20,
              direction: 'outbound'
            }
          ]
        };
      }
      
      const response = await api.get(endpoint, { params });
      return response.data;
      */
    } catch (error) {
      console.error('Error loading call history:', error);
      // Return a default empty response
      return {
        success: true,
        totalCount: 0,
        callHistory: []
      };
    }
  }

  /**
   * Holt Anrufstatistiken
   * @param {Object} options - Filter- und Paginierungsoptionen
   * @returns {Promise<Object>} Anrufstatistiken
   */
  async getCallStats(options = {}) {
    try {
      const params = {
        userId: options.userId,
        startDate: options.startDate,
        endDate: options.endDate
      };
      
      const endpoint = DIALER_ENDPOINTS.stats.replace(/^\/api/, '');
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Error loading call statistics:', error);
      throw error;
    }
  }

  /**
   * Holt die verfügbaren Agents
   * @returns {Promise<Object>} Verfügbare Agents
   */
  async getAvailableAgents() {
    try {
      const endpoint = DIALER_ENDPOINTS.agents.replace(/^\/api/, '');
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error loading available agents:', error);
      throw error;
    }
  }

  /**
   * Fügt Clients zur Call-Queue hinzu
   * @param {Array} clients - Liste der Clients zum Anrufen
   * @param {Object} options - Optionen für die Queue
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async addToQueue(clients, options = {}) {
    try {
      const endpoint = DIALER_ENDPOINTS.queue().replace(/^\/api/, '');
      const response = await api.post(endpoint, {
        clients,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to call queue:', error);
      throw error;
    }
  }
  
  /**
   * Fügt Telefonnummern direkt zur Call-Queue hinzu (ohne Clientverknüpfung)
   * @param {string} userId - Die ID des Benutzers, der diese Nummern anrufen soll
   * @param {Array<string>} phoneNumbers - Liste der anzurufenden Telefonnummern
   * @param {Object} options - Optionen für die Queue
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async addPhoneNumbersToQueue(userId, phoneNumbers, options = {}) {
    try {
      const endpoint = DIALER_ENDPOINTS.queue().replace(/^\/api/, '');
      console.log(`Adding phone numbers to queue at: ${endpoint}`, { userId, phoneNumbers, options });
      
      // Add fake dummy response for development
      if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
        console.log('Returning mock add to queue response for development');
        
        // Wait a moment to simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
          success: true,
          message: `${phoneNumbers.length} numbers added to queue successfully`,
          results: phoneNumbers.map((phone, index) => ({
            success: true,
            phoneNumber: phone,
            queueItemId: `mock-queue-${index}-${Date.now()}`,
            scheduledFor: new Date(new Date().getTime() + (index + 1) * 5 * 60000) // Each 5 mins later
          }))
        };
      }
      
      const response = await api.post(endpoint, {
        userId,
        phoneNumbers,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error adding phone numbers to call queue:', error);
      // Return a more user-friendly response
      return {
        success: false,
        message: 'Failed to add phone numbers to queue',
        error: error.message
      };
    }
  }

  /**
   * Aktualisiert ein Queue-Element
   * @param {string} queueItemId - ID des Queue-Elements
   * @param {Object} updates - Zu aktualisierende Felder
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async updateQueueItem(queueItemId, updates) {
    try {
      const response = await api.put(`/dialer/queue/${queueItemId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating queue item:', error);
      throw error;
    }
  }

  /**
   * Entfernt ein Element aus der Call-Queue
   * @param {string} queueItemId - ID des Queue-Elements
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async removeFromQueue(queueItemId) {
    try {
      const response = await api.delete(`/dialer/queue/${queueItemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from call queue:', error);
      throw error;
    }
  }

  /**
   * Initialisiert den PowerDialer
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async initialize() {
    try {
      const endpoint = DIALER_ENDPOINTS.initialize.replace(/^\/api/, '');
      const response = await api.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error initializing dialer:', error);
      throw error;
    }
  }
}

export default new DialerService();