import React, { useState } from 'react';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

export default function RecentNewsFeed({ news, symbol }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  if (!news || news.length === 0) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Recent Company News & Sentiment
          </h2>
        </div>

        <span className="badge badge-indigo" style={{ fontSize: '0.78rem' }}>
          AI Sentiment Feed
        </span>
      </div>

      {/* News List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {news.map((item) => (
          <div 
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'flex-start',
              gap: '16px'
            }}
            className="news-item-hover"
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.source}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {item.publishedAt}
                </span>
                
                {/* Sentiment Tag */}
                <span className={`badge badge-${item.sentimentColor}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {item.sentiment === 'Bullish' && <TrendingUp size={11} />}
                  {item.sentiment === 'Bearish' && <TrendingDown size={11} />}
                  {item.sentiment === 'Neutral' && <Minus size={11} />}
                  {item.sentiment}
                </span>
              </div>

              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4, marginBottom: '6px' }}>
                {item.title}
              </h4>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.summary}
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
              <ExternalLink size={16} color="var(--text-muted)" />
            </div>

          </div>
        ))}
      </div>

      {/* Article Detail Reader Modal */}
      {selectedArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '580px', width: '100%', padding: '28px', border: '1px solid rgba(255,255,255,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className={`badge badge-${selectedArticle.sentimentColor}`}>
                {selectedArticle.sentiment} Impact
              </span>
              <button 
                onClick={() => setSelectedArticle(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.4 }}>
              {selectedArticle.title}
            </h3>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              Source: {selectedArticle.source} • {selectedArticle.publishedAt}
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              {selectedArticle.summary}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedArticle(null)} className="btn btn-secondary">
                Close
              </button>
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Open Full Article <ExternalLink size={16} />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
