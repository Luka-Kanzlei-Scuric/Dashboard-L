import express from 'express';
import dialerController from '../controllers/dialerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// System/Service management endpoints
router.post('/initialize', authMiddleware, dialerController.initialize);
router.get('/config', authMiddleware, dialerController.getConfig);
router.post('/config', authMiddleware, dialerController.updateConfig);

// PowerDialer control endpoints
router.post('/start/:userId', authMiddleware, dialerController.startDialer);
router.post('/pause/:userId', authMiddleware, dialerController.pauseDialer);
router.post('/stop/:userId', authMiddleware, dialerController.stopDialer);
router.get('/status/:userId', authMiddleware, dialerController.getDialerStatus);
router.get('/agents', authMiddleware, dialerController.getAvailableAgents);

// Queue management endpoints
router.post('/queue', authMiddleware, dialerController.addToQueue);
router.get('/queue', authMiddleware, dialerController.getQueue);
router.get('/queue/:userId', authMiddleware, dialerController.getQueue);
router.put('/queue/:queueItemId', authMiddleware, dialerController.updateQueueItem);
router.delete('/queue/:queueItemId', authMiddleware, dialerController.removeFromQueue);

// Call history and stats endpoints
router.get('/history', authMiddleware, dialerController.getCallHistory);
router.get('/stats', authMiddleware, dialerController.getCallStats);

// Webhook endpoint (no auth required for external services)
router.post('/webhook', dialerController.processWebhook);

export default router;