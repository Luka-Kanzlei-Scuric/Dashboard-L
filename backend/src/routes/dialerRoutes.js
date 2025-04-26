import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  makeCall, 
  getCallHistory, 
  getCallDetails, 
  updateCallNotes,
  getDialerStatus,
  startDialer,
  stopDialer,
  pauseDialer,
  getCallQueue,
  addToQueue,
  removeFromQueue
} from '../controllers/dialerController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Dialer status and control
router.get('/status/:userId', getDialerStatus);
router.post('/start/:userId', startDialer);
router.post('/stop/:userId', stopDialer);
router.post('/pause/:userId', pauseDialer);

// Call management
router.post('/call', makeCall);
router.get('/call/:id', getCallDetails);
router.put('/call/:id/notes', updateCallNotes);

// Call history
router.get('/history', getCallHistory);

// Queue management
router.get('/queue/:userId?', getCallQueue);
router.post('/queue', addToQueue);
router.delete('/queue/:id', removeFromQueue);

export default router;