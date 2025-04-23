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
      const response = await api.get(DIALER_ENDPOINTS.status(userId));
      return response.data;
    } catch (error) {
      console.error('Error getting dialer status:', error);
      throw error;
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
      const response = await api.post(DIALER_ENDPOINTS.start(userId), {
        aircallUserId: config.userId,
        numberId: config.numberId
      });
      return response.data;
    } catch (error) {
      console.error('Error starting dialer:', error);
      throw error;
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
      const response = await api.post(DIALER_ENDPOINTS.pause(userId), { reason });
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
      const response = await api.post(DIALER_ENDPOINTS.stop(userId));
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
      
      const response = await api.get(DIALER_ENDPOINTS.queue(userId), { params });
      return response.data;
    } catch (error) {
      console.error('Error loading call queue:', error);
      throw error;
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
      
      const response = await api.get(DIALER_ENDPOINTS.history, { params });
      return response.data;
    } catch (error) {
      console.error('Error loading call history:', error);
      throw error;
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
      
      const response = await api.get(DIALER_ENDPOINTS.stats, { params });
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
      const response = await api.get(DIALER_ENDPOINTS.agents);
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
      const response = await api.post(DIALER_ENDPOINTS.queue(), {
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
   * Aktualisiert ein Queue-Element
   * @param {string} queueItemId - ID des Queue-Elements
   * @param {Object} updates - Zu aktualisierende Felder
   * @returns {Promise<Object>} Erfolg/Misserfolg und Statusinformationen
   */
  async updateQueueItem(queueItemId, updates) {
    try {
      const response = await api.put(`/api/dialer/queue/${queueItemId}`, updates);
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
      const response = await api.delete(`/api/dialer/queue/${queueItemId}`);
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
      const response = await api.post(DIALER_ENDPOINTS.initialize);
      return response.data;
    } catch (error) {
      console.error('Error initializing dialer:', error);
      throw error;
    }
  }
}

export default new DialerService();