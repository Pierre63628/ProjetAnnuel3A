import { Router } from 'express';
import { MessagingController } from '../controllers/messaging.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Chat Rooms Routes
router.get('/rooms', MessagingController.getChatRooms);

router.get('/rooms/available', MessagingController.getAvailableRooms);

router.get('/rooms/:roomId',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.getChatRoom
);

router.post('/rooms',
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Room name must be between 1 and 255 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('room_type').isIn(['group', 'direct']).withMessage('Room type must be either group or direct'),
    body('member_ids').optional().isArray().withMessage('Member IDs must be an array'),
    body('member_ids.*').optional().isInt({ min: 1 }).withMessage('Each member ID must be a positive integer'),
    validateRequest,
    MessagingController.createChatRoom
);

router.post('/rooms/:roomId/join',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.joinChatRoom
);

router.post('/rooms/:roomId/leave',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.leaveChatRoom
);

router.post('/direct-message',
    body('target_user_id').isInt({ min: 1 }).withMessage('Target user ID must be a positive integer'),
    validateRequest,
    MessagingController.createOrGetDirectMessage
);

router.post('/offline-direct-message',
    body('target_user_id').isInt({ min: 1 }).withMessage('Target user ID must be a positive integer'),
    validateRequest,
    MessagingController.createOfflineDirectMessage
);

// Messages Routes
router.get('/rooms/:roomId/messages',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Before must be a valid ISO date'),
    query('after').optional().isISO8601().withMessage('After must be a valid ISO date'),
    validateRequest,
    MessagingController.getMessages
);

router.get('/rooms/:roomId/unread-count',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.getUnreadCount
);

router.post('/rooms/:roomId/mark-read',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.markAsRead
);

// Offline Messages Routes
router.get('/messages/undelivered', MessagingController.getUndeliveredMessages);

router.get('/messages/undelivered/count', MessagingController.getUndeliveredMessageCount);

router.post('/messages/:messageId/mark-read',
    param('messageId').isInt({ min: 1 }).withMessage('Message ID must be a positive integer'),
    validateRequest,
    MessagingController.markMessageAsRead
);

// Members Routes
router.get('/rooms/:roomId/members',
    param('roomId').isInt({ min: 1 }).withMessage('Room ID must be a positive integer'),
    validateRequest,
    MessagingController.getRoomMembers
);

// Presence Routes
router.get('/users/online', MessagingController.getOnlineUsers);

// Neighborhood Users Routes
router.get('/users/neighborhood', MessagingController.getNeighborhoodUsers);

export default router;
