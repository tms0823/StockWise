import React from 'react';

const BookmarkIcon = ({ size = 22, color = '#818cf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ShieldAlertIcon = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const formatReputation = (item) => {
  if (item.reputationScore != null) {
    return `Score ${item.reputationScore.toFixed(1)}`;
  }
  if (item.provisionalScore != null) {
    return `Provisional ${item.provisionalScore.toFixed(1)}`;
  }
  return 'Unavailable';
};

const riskColor = (riskLevel) => {
  if (riskLevel === 'High') return '#d93025';
  if (riskLevel === 'Medium') return '#f59e0b';
  return '#188038';
};

export default function WatchlistDrawer({
  isOpen,
  onClose,
  watchlistItems,
  onSelectSymbol,
  onRemoveFromWatchlist,
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
        maxWidth: '400px',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookmarkIcon />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#333' }}>
                Your Watchlist ({watchlistItems.length})
              </h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#5f6368', fontSize: '1.4rem', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          {/* Watchlist Items */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#5f6368', padding: '40px 20px', fontSize: '0.9rem' }}>
              Loading watchlist...
            </div>
          ) : watchlistItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#5f6368', padding: '40px 20px' }}>
              <BookmarkIcon size={40} color="#5f6368" />
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '12px' }}>No stocks bookmarked yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Click "Add to Watchlist" on any company profile page.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
              {watchlistItems.map(item => {
                const isPositive = (item.dailyChange ?? 0) >= 0;
                return (
                  <div
                    key={item.symbol}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => {
                        onSelectSymbol(item.symbol);
                        onClose();
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: '#333' }}>
                          {item.symbol}
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                          {formatReputation(item)}
                        </span>
                        {item.riskLevel && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
                              color: riskColor(item.riskLevel),
                              border: `1px solid ${riskColor(item.riskLevel)}`,
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <ShieldAlertIcon /> {item.riskLevel} Risk
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '2px' }}>
                        {item.name || 'Unknown Company'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: '#333' }}>
                          {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isPositive ? '#188038' : '#d93025' }}>
                          {item.dailyChangePercent != null
                            ? `${isPositive ? '+' : ''}${item.dailyChangePercent.toFixed(2)}%`
                            : 'N/A'}
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFromWatchlist(item.symbol)}
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#d93025' }}
                        title="Remove from Watchlist"
                      >
                        <TrashIcon />
                      </button>
                    </div>

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