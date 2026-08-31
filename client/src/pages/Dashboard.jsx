import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WatchlistDrawer from '../components/WatchlistDrawer';
import NotificationsPanel from '../components/NotificationsPanel';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';
import {
  scanNotifications,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    try {
      const res = await getWatchlist();
      setWatchlistItems(res.data.data || []);
    } catch (err) {
      setWatchlistItems([]);
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data?.count ?? 0);
    } catch (err) {
      setUnreadCount(0);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Load watchlist + unread count on mount.
  useEffect(() => {
    loadWatchlist();
    loadUnreadCount();
  }, [loadWatchlist, loadUnreadCount]);

  const openWatchlist = async () => {
    setWatchlistOpen(true);
    await loadWatchlist();
  };

  const openNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsOpen(true);
    // Explicit scan before refreshing the notification list/count.
    try {
      await scanNotifications();
    } catch (err) {
      // Scan failure should not block viewing existing notifications.
    }
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlistItems((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (err) {
      // Keep the item; the user can retry.
    }
  };

  const handleSelectSymbol = (symbol) => {
    navigate(`/company/${encodeURIComponent(symbol)}`);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Ignore — user can retry.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Ignore — user can retry.
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <h2>Welcome, {user.name}</h2>
      <div className="user-info">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Virtual Balance:</strong> {user.virtualBalance}
        </p>
      </div>

      {/* Watchlist & Notifications quick access */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={openWatchlist}>
          {watchlistLoading ? 'My Watchlist (...)' : `My Watchlist (${watchlistItems.length})`}
        </button>
        <button type="button" className="btn" onClick={openNotifications}>
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={() => navigate('/market-overview')}>
          Market Overview Dashboard
        </button>
        <button type="button" className="btn" onClick={() => navigate('/stocks')}>
          Live Stock Market Data
        </button>
        <button type="button" className="btn" onClick={() => navigate('/stocks/chart')}>
          Stock Chart & Comparison
        </button>
        <button type="button" className="btn" onClick={() => navigate('/search')}>
          Stock Search & Filter
        </button>
        <button type="button" className="btn" onClick={() => navigate('/dummy-investment')}>
          Dummy Investment
        </button>
        <button type="button" className="btn" onClick={() => navigate('/portfolio')}>
          My Portfolio
        </button>
        <button type="button" className="btn" onClick={() => navigate('/learn/cue-cards')}>
          Learn — Cue Cards
        </button>
        <button type="button" className="btn" onClick={() => navigate('/company/AAPL')}>
          Company Profile & Financial Indicators
        </button>
        <button type="button" className="btn" onClick={() => navigate('/learn/news-explainer')}>
          Explain Market News
        </button>
        <button type="button" className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlistItems={watchlistItems}
        onSelectSymbol={handleSelectSymbol}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        loading={watchlistLoading}
      />

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        loading={notificationsLoading}
      />
    </div>
  );
}

export default Dashboard;
