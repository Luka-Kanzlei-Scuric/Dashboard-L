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
  updateTelefonieSettings
} from '../controllers/dialerController.js';

const router = express.Router();

// Protect all routes
router.use(auth);

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

export default router;