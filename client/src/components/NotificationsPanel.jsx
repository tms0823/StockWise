import React from 'react';

const BellIcon = ({ size = 22, color = '#818cf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrendingUpIcon = ({ size = 15, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ShieldIcon = ({ size = 15, color = '#818cf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.28)',
      backdropFilter: 'blur(4px)',
      zIndex: 90,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        borderRadius: 0,
        borderRight: 0,
        borderTop: 0,
        borderBottom: 0,
        padding: '24px',
        background: '#fff',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BellIcon />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#333' }}>
                Notifications ({notifications.length})
              </h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#5f6368', fontSize: '1.4rem', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          {/* Mark all read */}
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllRead}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '16px', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <CheckIcon /> Mark all as read
            </button>
          )}

          {/* Notifications list */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#5f6368', padding: '40px 20px', fontSize: '0.9rem' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#5f6368', padding: '40px 20px' }}>
              <BellIcon size={40} color="#5f6368" />
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '12px' }}>No notifications yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                Add stocks to your watchlist and scan to receive alerts.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {notifications.map((item) => {
                const isPrice = item.type === 'PRICE_CHANGE';
                return (
                  <div
                    key={item._id}
                    style={{
                      background: '#f8f9fa',
                      border: `1px solid ${item.read ? '#e0e4e8' : 'rgba(26, 115, 232, 0.35)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {isPrice ? <TrendingUpIcon /> : <ShieldIcon />}
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: '#333' }}>
                          {item.symbol}
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.62rem' }}>
                          {isPrice ? 'Price' : 'Reputation'}
                        </span>
                        {!item.read && (
                          <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>
                            New
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#5f6368', marginTop: '2px' }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '6px' }}>
                        {formatTime(item.createdAt)}
                      </div>
                    </div>

                    {!item.read && (
                      <button
                        onClick={() => onMarkRead(item._id)}
                        style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#818cf8' }}
                        title="Mark as read"
                      >
                        <CheckIcon />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', fontSize: '0.75rem', color: '#5f6368', textAlign: 'center' }}>
          StockWise Investment Support System
        </div>
      </div>
    </div>
  );
}