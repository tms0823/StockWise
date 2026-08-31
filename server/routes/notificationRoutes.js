const express = require('express');
const {
  scan,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes are scoped to the authenticated user.
router.post('/scan', protect, scan);
router.get('/unread-count', protect, unreadCount);
// NOTE: /read-all must be registered before /:id/read so Express does not
// treat "read-all" as an :id parameter.
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);
router.get('/', protect, listNotifications);

module.exports = router;