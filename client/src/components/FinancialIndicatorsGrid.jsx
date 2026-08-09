import React, { useState } from 'react';
import { Percent, TrendingUp, DollarSign, Scale, PieChart, HelpCircle, Layers, Shield } from 'lucide-react';

export default function FinancialIndicatorsGrid({ indicators }) {
  if (!indicators) return null;

  const [activeTooltip, setActiveTooltip] = useState(null);

  const metricCards = [
    {
      id: 'pe',
      title: 'Price-to-Earnings (P/E)',
      value: `${indicators.peRatio}x`,
      subValue: `Sector Avg: ${indicators.sectorAvgPE}x`,
      status: indicators.peRatio > indicators.sectorAvgPE ? 'Premium Valuation' : 'Fair Valuation',
      statusColor: indicators.peRatio > indicators.sectorAvgPE ? 'amber' : 'green',
      icon: Scale,
      color: '#6366f1',
      description: 'Measures how much investors are willing to pay per $1 of company earnings. High P/E suggests high growth expectations.'
    },
    {
      id: 'eps',
      title: 'Earnings Per Share (EPS)',
      value: `$${indicators.eps.toFixed(2)}`,
      subValue: `YoY Growth: ${indicators.epsGrowthYoY > 0 ? '+' : ''}${indicators.epsGrowthYoY}%`,
      status: indicators.epsGrowthYoY > 0 ? 'Profit Growing' : 'Declining EPS',
      statusColor: indicators.epsGrowthYoY > 0 ? 'green' : 'red',
      icon: DollarSign,
      color: '#10b981',
      description: 'Net profit divided by total outstanding shares. Higher EPS indicates stronger profitability per share.'
    },
    {
      id: 'dividend',
      title: 'Dividend Information',
      value: `${indicators.dividendYield.toFixed(2)}%`,
      subValue: `Annual: $${indicators.annualDividend.toFixed(2)} / Payout: ${indicators.payoutRatio}%`,
      status: indicators.dividendYield > 0 ? 'Dividend Paying' : 'No Dividend',
      statusColor: indicators.dividendYield > 0 ? 'green' : 'amber',
      icon: Percent,
      color: '#06b6d4',
      description: 'Percentage of share price paid out to shareholders annually as cash dividends.'
    },
    {
      id: 'growth',
      title: 'Revenue Growth (YoY)',
      value: `${indicators.revenueGrowth > 0 ? '+' : ''}${indicators.revenueGrowth.toFixed(1)}%`,
      subValue: 'Year-over-Year Sales Growth',
      status: indicators.revenueGrowth >= 10 ? 'High Growth' : indicators.revenueGrowth > 0 ? 'Moderate Growth' : 'Contracting',
      statusColor: indicators.revenueGrowth >= 10 ? 'green' : indicators.revenueGrowth > 0 ? 'amber' : 'red',
      icon: TrendingUp,
      color: '#8b5cf6',
      description: 'Percentage change in total sales/revenue compared to the same period in the previous year.'
    },
    {
      id: 'debt',
      title: 'Debt Level (Debt-to-Equity)',
      value: `${indicators.debtToEquity.toFixed(2)}`,
      subValue: `Safety Rating: ${indicators.debtSafetyRating}`,
      status: indicators.debtSafetyRating,
      statusColor: indicators.debtToEquity < 0.5 ? 'green' : indicators.debtToEquity < 1.5 ? 'amber' : 'red',
      icon: Shield,
      color: '#f59e0b',
      description: 'Compares total liabilities to shareholders equity. Lower ratio (< 1.0) means lower financial debt risk.'
    },
    {
      id: 'margin',
      title: 'Profit Margin (Net)',
      value: `${indicators.profitMargin.toFixed(1)}%`,
      subValue: `Operating Margin: ${indicators.operatingMargin.toFixed(1)}%`,
      status: indicators.profitMargin >= 20 ? 'High Profitability' : indicators.profitMargin >= 10 ? 'Healthy' : 'Thin Margins',
      statusColor: indicators.profitMargin >= 20 ? 'green' : 'amber',
      icon: PieChart,
      color: '#ec4899',
      description: 'Percentage of total revenue retained as net profit after deducting all operating expenses, taxes, and interest.'
    }
  ];

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Fundamental Financial Indicators
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Key performance metrics to evaluate company health before investing
          </p>
        </div>

        <span className="badge badge-indigo" style={{ fontSize: '0.78rem' }}>
          Educational Analytics
        </span>
      </div>

      {/* Grid of Financial Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {metricCards.map((card) => {
          const IconComp = card.icon;
          return (
            <div 
              key={card.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={() => setActiveTooltip(card.id)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: `${card.color}22`, padding: '8px', borderRadius: '10px' }}>
                    <IconComp size={20} color={card.color} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {card.title}
                  </span>
                </div>

                <HelpCircle size={16} color="var(--text-dim)" style={{ cursor: 'pointer' }} />
              </div>

              {/* Metric Value */}
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {card.value}
              </div>

              {/* SubValue & Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>
                  {card.subValue}
                </span>

                <span className={`badge badge-${card.statusColor}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {card.status}
                </span>
              </div>

              {/* Educational Tooltip Box */}
              {activeTooltip === card.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '105%',
                  left: '0',
                  right: '0',
                  background: '#090d16',
                  border: '1px solid var(--accent-primary)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                  zIndex: 20,
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4
                }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    What is {card.title}?
                  </strong>
                  {card.description}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Bonus Summary Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.82rem', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          Return on Equity (ROE): <strong style={{ color: 'var(--text-main)' }}>{indicators.roe}%</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Beta (Volatility): <strong style={{ color: 'var(--text-main)' }}>{indicators.beta}</strong>
        </span>
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
          💡 Tip: Compare P/E Ratio with Sector Avg before investing!
        </span>
      </div>

    </div>
  );
}
