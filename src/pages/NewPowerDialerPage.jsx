import React, { useState, useEffect, useCallback } from 'react';
import { 
  PhoneIcon, 
  PauseIcon, 
  PlayIcon, 
  ClockIcon, 
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import dialerService from '../services/dialerService';

/**
 * NewPowerDialerPage - Integrates with the server-side PowerDialer architecture
 * 
 * This component demonstrates how to connect to the new PowerDialer backend
 * and provides a simple interface for dialer control and queue management.
 */
const NewPowerDialerPage = () => {
  // User states
  const [userId, setUserId] = useState(null);
  const [aircallConfig, setAircallConfig] = useState({
    userId: '',
    numberId: ''
  });
  
  // Dialer states
  const [dialerActive, setDialerActive] = useState(false);
  const [dialerStatus, setDialerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Queue and call states
  const [callQueue, setCallQueue] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  
  // Stats
  const [sessionStats, setSessionStats] = useState({
    startTime: null,
    callsCompleted: 0,
    totalCallDuration: 0
  });
  
  /**
   * Initialize the component with current user ID
   */
  useEffect(() => {
    // In a real implementation, get the user ID from auth context
    const currentUserId = localStorage.getItem('userId') || '64a12b3c5f7d2e1a3c9b8e7f';
    setUserId(currentUserId);
    
    // Get initial status
    if (currentUserId) {
      getDialerStatus(currentUserId);
    }
  }, []);
  
  /**
   * Get the current status of the PowerDialer
   */
  const getDialerStatus = async (id) => {
    try {
      setLoading(true);
      const data = await dialerService.getDialerStatus(id || userId);
      
      if (data.success) {
        setDialerStatus(data);
        setDialerActive(data.online && data.connected);
        setActiveCall(data.activeCall);
        setSessionStats(data.sessionStats || {
          startTime: null,
          callsCompleted: 0,
          totalCallDuration: 0
        });
      }
    } catch (error) {
      console.error('Error getting dialer status:', error);
      setError('Failed to get dialer status');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Start the PowerDialer
   */
  const startDialer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      if (!aircallConfig.userId || !aircallConfig.numberId) {
        setError('Aircall User ID and Number ID are required');
        return;
      }
      
      const data = await dialerService.startDialer(userId, {
        userId: aircallConfig.userId,
        numberId: aircallConfig.numberId
      });
      
      if (data.success) {
        setDialerActive(true);
        getDialerStatus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error starting dialer:', error);
      setError(error.response?.data?.message || 'Failed to start dialer');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Pause the PowerDialer
   */
  const pauseDialer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dialerService.pauseDialer(userId, 'break');
      
      if (data.success) {
        getDialerStatus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error pausing dialer:', error);
      setError(error.response?.data?.message || 'Failed to pause dialer');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Stop the PowerDialer
   */
  const stopDialer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dialerService.stopDialer(userId);
      
      if (data.success) {
        setDialerActive(false);
        setActiveCall(null);
        setSessionStats(data.sessionStats || {
          startTime: null,
          callsCompleted: 0,
          totalCallDuration: 0
        });
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error stopping dialer:', error);
      setError(error.response?.data?.message || 'Failed to stop dialer');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Load the call queue
   */
  const loadCallQueue = async () => {
    try {
      const data = await dialerService.getCallQueue(userId);
      
      if (data.success) {
        setCallQueue(data.queueItems || []);
      }
    } catch (error) {
      console.error('Error loading call queue:', error);
    }
  };
  
  /**
   * Load call history
   */
  const loadCallHistory = async () => {
    try {
      const data = await dialerService.getCallHistory({ 
        userId, 
        limit: 10 
      });
      
      if (data.success) {
        setCallHistory(data.callHistory || []);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };
  
  /**
   * Handle changes to Aircall config fields
   */
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setAircallConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Format duration in seconds to HH:MM:SS
   */
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  /**
   * Format date to local date and time
   */
  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };
  
  /**
   * Auto-refresh dialer status periodically when active
   */
  useEffect(() => {
    if (dialerActive && userId) {
      const interval = setInterval(() => {
        getDialerStatus();
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [dialerActive, userId]);
  
  // Load initial data
  useEffect(() => {
    if (userId) {
      loadCallQueue();
      loadCallHistory();
    }
  }, [userId]);
  
  return (
    <div className="h-full w-full bg-[#f5f5f7] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-light text-gray-800">New PowerDialer</h1>
            <p className="text-xs md:text-sm text-gray-500 font-light">Server-based architecture</p>
          </div>
          
          {/* Dialer Controls */}
          <div className="flex items-center space-x-2">
            {dialerActive ? (
              <>
                <button
                  onClick={pauseDialer}
                  disabled={loading}
                  className="flex items-center rounded-full py-1.5 px-3 transition-all duration-300 bg-orange-50 text-orange-500 hover:bg-orange-100"
                >
                  <PauseIcon className="w-3 h-3 mr-1.5" />
                  <span className="text-xs font-light">Pause</span>
                </button>
                <button
                  onClick={stopDialer}
                  disabled={loading}
                  className="flex items-center rounded-full py-1.5 px-3 transition-all duration-300 bg-red-50 text-red-500 hover:bg-red-100"
                >
                  <XMarkIcon className="w-3 h-3 mr-1.5" />
                  <span className="text-xs font-light">Stop</span>
                </button>
              </>
            ) : (
              <button
                onClick={startDialer}
                disabled={loading}
                className="flex items-center rounded-full py-1.5 px-3 transition-all duration-300 bg-green-50 text-green-600 hover:bg-green-100"
              >
                <PlayIcon className="w-3 h-3 mr-1.5" />
                <span className="text-xs font-light">Start Dialer</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-700">PowerDialer Configuration</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="aircallUserId" className="block text-sm text-gray-600 mb-1">
                  Aircall User ID
                </label>
                <input
                  type="text"
                  id="aircallUserId"
                  name="userId"
                  value={aircallConfig.userId}
                  onChange={handleConfigChange}
                  placeholder="Your Aircall User ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  disabled={dialerActive}
                />
              </div>
              <div>
                <label htmlFor="numberId" className="block text-sm text-gray-600 mb-1">
                  Aircall Number ID
                </label>
                <input
                  type="text"
                  id="numberId"
                  name="numberId"
                  value={aircallConfig.numberId}
                  onChange={handleConfigChange}
                  placeholder="Your Aircall Number ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  disabled={dialerActive}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Dialer Status */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-700">Dialer Status</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <div className={`flex items-center rounded-full px-2 py-0.5 ${
                    dialerActive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1.5 ${
                      dialerActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs font-light">
                      {dialerActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Session time:</span>
                  <span className="text-sm font-mono">
                    {sessionStats.startTime 
                      ? formatDuration(Math.floor((new Date() - new Date(sessionStats.startTime)) / 1000))
                      : '00:00:00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Calls completed:</span>
                  <span className="text-sm font-mono">{sessionStats.callsCompleted || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total call time:</span>
                  <span className="text-sm font-mono">{formatDuration(sessionStats.totalCallDuration || 0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Call */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-700">Active Call</h2>
            </div>
            <div className="p-4">
              {activeCall ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                      <UserIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">
                        {activeCall.client?.name || 'Unknown Client'}
                      </h3>
                      <p className="text-xs text-gray-500">{activeCall.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className="flex items-center rounded-full px-2 py-0.5 bg-green-50 text-green-600">
                      <div className="w-2 h-2 rounded-full mr-1.5 bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-light">In progress</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Started:</span>
                    <span className="text-xs font-light">{formatDateTime(activeCall.startTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Duration:</span>
                    <span className="text-sm font-mono">
                      {formatDuration(Math.floor((new Date() - new Date(activeCall.startTime)) / 1000))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <PhoneIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No active call</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Call Queue */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-700">Call Queue</h2>
              <button 
                onClick={loadCallQueue}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>
            <div className="p-4">
              {callQueue.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {callQueue.map((item) => (
                    <div key={item._id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.client?.name || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-gray-500">{item.phoneNumber}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-light text-gray-500">
                          {formatDateTime(item.scheduledFor)}
                        </span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${
                          item.status === 'pending' ? 'bg-blue-50 text-blue-500' : 
                          item.status === 'in-progress' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <ClockIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No calls in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Call History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-700">Recent Call History</h2>
            <button 
              onClick={loadCallHistory}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {callHistory.length > 0 ? (
                  callHistory.map((call) => (
                    <tr key={call._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.client?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{call.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          call.status === 'no-answer' ? 'bg-yellow-100 text-yellow-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDateTime(call.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDuration(call.duration || 0)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No call history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPowerDialerPage;