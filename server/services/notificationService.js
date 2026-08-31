// NotificationService: detects price/reputation changes for a user's
// watchlist and persists notifications. Reuses existing stock/reputation
// services — no duplicated algorithms.

const Notification = require('../models/Notification');
const { getQuote } = require('./stockService');
const { getReputation } = require('./reputationService');

// Single named backend constant for the price alert threshold.
const PRICE_ALERT_THRESHOLD_PERCENT = 5;

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Get the usable current reputation value for a symbol:
 * full score when available, otherwise provisionalScore, otherwise null.
 */
const getUsableReputationValue = async (symbol) => {
  try {
    const reputation = await getReputation(symbol);
    if (!reputation) return null;
    if (isFiniteNumber(reputation.score)) return reputation.score;
    if (isFiniteNumber(reputation.provisionalScore)) return reputation.provisionalScore;
    return null;
  } catch (error) {
    // Reputation unavailable — do not fabricate a value.
    return null;
  }
};

/**
 * Scan the authenticated user's watchlist for price/reputation changes.
 * Initializes missing baselines without creating notifications.
 * Returns a summary of notifications created.
 */
const scanWatchlist = async (user) => {
  const entries = user.watchlist || [];
  let priceNotifications = 0;
  let reputationNotifications = 0;
  let baselinesInitialized = 0;
  let changed = false;

  for (const entry of entries) {
    const symbol = entry.symbol;

    // --- Price change detection ---
    let currentPrice = null;
    try {
      const quote = await getQuote(symbol);
      currentPrice = quote && quote.currentPrice != null ? quote.currentPrice : null;
    } catch (error) {
      // Provider failure/rate-limit — skip price detection for this symbol.
      currentPrice = null;
    }

    if (isFiniteNumber(currentPrice) && currentPrice > 0) {
      if (!isFiniteNumber(entry.priceAlertBaseline)) {
        // No baseline — initialize with current price, no notification.
        entry.priceAlertBaseline = currentPrice;
        baselinesInitialized += 1;
        changed = true;
      } else {
        const baseline = entry.priceAlertBaseline;
        const changePercent = ((currentPrice - baseline) / baseline) * 100;
        if (Math.abs(changePercent) >= PRICE_ALERT_THRESHOLD_PERCENT) {
          await Notification.create({
            user: user._id,
            symbol,
            type: 'PRICE_CHANGE',
            previousValue: baseline,
            newValue: currentPrice,
            changePercent,
            message: `${symbol} price moved ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% to $${currentPrice.toFixed(2)}`,
          });
          priceNotifications += 1;
          // Update baseline to current price to prevent duplicate alerts.
          entry.priceAlertBaseline = currentPrice;
          changed = true;
        }
        // Movement below threshold: retain baseline so gradual movement
        // can accumulate toward the threshold.
      }
    }

    // --- Reputation change detection ---
    const currentReputation = await getUsableReputationValue(symbol);
    if (isFiniteNumber(currentReputation)) {
      if (!isFiniteNumber(entry.reputationBaseline)) {
        // No baseline — initialize, no notification.
        entry.reputationBaseline = currentReputation;
        baselinesInitialized += 1;
        changed = true;
      } else if (entry.reputationBaseline !== currentReputation) {
        await Notification.create({
          user: user._id,
          symbol,
          type: 'REPUTATION_CHANGE',
          previousValue: entry.reputationBaseline,
          newValue: currentReputation,
          message: `${symbol} reputation score changed from ${entry.reputationBaseline} to ${currentReputation}`,
        });
        reputationNotifications += 1;
        entry.reputationBaseline = currentReputation;
        changed = true;
      }
    }
    // Reputation unavailable: do not fabricate, do not create a false notification.
  }

  if (changed) {
    user.markModified('watchlist');
    await user.save();
  }

  return {
    priceNotifications,
    reputationNotifications,
    totalNotifications: priceNotifications + reputationNotifications,
    baselinesInitialized,
  };
};

/**
 * Get a user's notifications, newest first.
 */
const getNotifications = async (userId) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).lean();
};

/**
 * Get a user's unread notification count.
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

/**
 * Mark a single notification as read, scoped to the authenticated user.
 * Returns the updated notification or null if not found/not owned.
 */
const markNotificationRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  ).lean();
  return notification;
};

/**
 * Mark all of a user's notifications as read.
 * Returns the number of notifications updated.
 */
const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, read: false },
    { read: true }
  );
  return result.modifiedCount || 0;
};

module.exports = {
  PRICE_ALERT_THRESHOLD_PERCENT,
  scanWatchlist,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};