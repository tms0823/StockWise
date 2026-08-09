import React from 'react';
import { ShieldCheck, AlertTriangle, Award, Info, Scale, CheckCircle2, TrendingUp } from 'lucide-react';

export default function ReputationRiskCard({ stock }) {
  if (!stock || !stock.reputation) return null;

  const { score, status, statusColor, riskLevel, riskBadge, riskColor, riskDescription, breakdown } = stock.reputation;

  // Determine reputation meter color gradient
  const getScoreGradient = (val) => {
    if (val >= 85) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (val >= 70) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
  };

  const getRiskBadgeClass = (riskStr) => {
    if (riskStr.includes('Low')) return 'badge-green';
    if (riskStr.includes('Moderate')) return 'badge-amber';
    return 'badge-red';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
      
      {/* 1. Company Reputation Score Card */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
        
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Award size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Company Reputation Score
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Multi-factor decision support score</p>
            </div>
          </div>
          
          <span className={`badge ${score >= 80 ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.82rem' }}>
            <CheckCircle2 size={13} /> {status}
          </span>
        </div>

        {/* Big Radial/Gauge Score Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
          
          {/* Circular Score Badge */}
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: getScoreGradient(score),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            border: '4px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}>
            <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', leadingHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
              OUT OF 100
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Reputation Rating: {score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : 'Moderate'}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
              Calculated using weighted financial stability, debt coverage, dividend history, and AI sentiment analysis.
            </p>
          </div>
        </div>

        {/* Breakdown Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          <BreakdownBar label="Financial Performance" value={breakdown.financialPerformance} />
          <BreakdownBar label="Stock Stability" value={breakdown.stockStability} />
          <BreakdownBar label="Dividend Record" value={breakdown.dividendRecord} />
          <BreakdownBar label="Debt Safety" value={breakdown.debtLevel} />
          <BreakdownBar label="Profit Growth" value={breakdown.profitGrowth} />
          <BreakdownBar label="News Sentiment" value={breakdown.newsSentiment} />

        </div>

      </div>

      {/* 2. Risk Level Assessment Card */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        <div>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <ShieldCheck size={22} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Investment Risk Level
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Risk assessment for dummy portfolio</p>
              </div>
            </div>

            <span className={`badge ${getRiskBadgeClass(riskLevel)}`} style={{ fontSize: '0.82rem' }}>
              <AlertTriangle size={13} /> {riskLevel}
            </span>
          </div>

          {/* Risk Detail Block */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Volatility Rating (Beta):</span>
              <span className="font-mono badge badge-indigo" style={{ fontSize: '0.9rem' }}>
                Beta = {stock.indicators.beta}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {riskDescription}
            </p>
          </div>
        </div>

        {/* Beta Scale Reference */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
            <span>Low Risk (&lt; 0.8)</span>
            <span>Market Avg (1.0)</span>
            <span>High Risk (&gt; 1.3)</span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '8px', borderRadius: '4px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: `${Math.min(100, Math.max(0, (stock.indicators.beta / 2.5) * 100))}%`,
              top: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
              transform: 'translateX(-50%)'
            }} />
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '10px', textAlign: 'center' }}>
            * StockWise educational rating based on historical volatility & debt-to-equity ratio.
          </div>
        </div>

      </div>

    </div>
  );
}

// Single Breakdown Progress Bar Item
function BreakdownBar({ label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
        <span>{label}</span>
        <span className="font-mono" style={{ color: 'var(--text-main)' }}>{value}/100</span>
      </div>
      <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: value >= 80 ? 'var(--stock-green)' : value >= 60 ? '#f59e0b' : 'var(--stock-red)',
          borderRadius: '3px'
        }} />
      </div>
    </div>
  );
}
