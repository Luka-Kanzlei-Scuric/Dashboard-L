import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import { 
  makeCall, 
  makeSipgateCall,
  getCallHistory, 
  getCallDetails, 
  updateCallNotes,
  getDialerStatus,
  startDialer,
  stopDialer,
  pauseDialer,
  getCallQueue,
  addToQueue,
  removeFromQueue,
  getTelefonieSettings,
  updateTelefonieSettings,
  // New OAuth2 routes
  authSipgate,
  sipgateOAuthCallback,
  sipgateOAuthStatus,
  sipgateStoreDeviceId
} from '../controllers/dialerController.js';

const router = express.Router();

// Protect all routes except the OAuth callback
router.use([
  '(?!/auth/sipgate/callback)',  // Don't protect the OAuth callback
  '(?!/auth/sipgate/status)',    // Don't protect the OAuth status check
], auth);

// Dialer status and control
router.get('/status/:userId', getDialerStatus);
router.post('/start/:userId', startDialer);
router.post('/stop/:userId', stopDialer);
router.post('/pause/:userId', pauseDialer);

// Call management
router.post('/call', makeCall);
router.post('/sipgate-call', makeSipgateCall);
router.get('/call/:id', getCallDetails);
router.put('/call/:id/notes', updateCallNotes);

// Call history
router.get('/history', getCallHistory);

// Queue management
router.get('/queue/:userId?', getCallQueue);
router.post('/queue', addToQueue);
router.delete('/queue/:id', removeFromQueue);

// Telefonie settings
router.get('/settings/telefonie', getTelefonieSettings);
router.post('/settings/telefonie', updateTelefonieSettings);

// SipGate OAuth2 routes
router.get('/auth/sipgate', authSipgate);
router.get('/auth/sipgate/callback', sipgateOAuthCallback); 
router.get('/auth/sipgate/status', sipgateOAuthStatus);
router.post('/auth/sipgate/device', sipgateStoreDeviceId);

export default router;