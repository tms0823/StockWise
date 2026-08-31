// NotificationController: HTTP layer for the authenticated user's
// notifications. All routes rely on the existing `protect` middleware.

const mongoose = require('mongoose');
const {
  scanWatchlist,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../services/notificationService');

/**
 * POST /api/notifications/scan
 * Explicitly scan the authenticated user's watchlist for changes.
 * This endpoint intentionally performs the database-writing scan.
 */
const scan = async (req, res, next) => {
  try {
    const summary = await scanWatchlist(req.user);
    res.status(200).json({
      success: true,
      message: 'Watchlist scan completed',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 * Return the authenticated user's notifications, newest first.
 */
const listNotifications = async (req, res, next) => {
  try {
    const notifications = await getNotifications(req.user._id);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Return the authenticated user's unread notification count.
 */
const unreadCount = async (req, res, next) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read (scoped to the authenticated user).
 */
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await markNotificationRead(req.user._id, id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all of the authenticated user's notifications as read.
 */
const markAllRead = async (req, res, next) => {
  try {
    const updated = await markAllNotificationsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { updated },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scan,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
};