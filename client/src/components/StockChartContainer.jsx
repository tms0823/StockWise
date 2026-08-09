import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function StockChartContainer({ symbol, currentPrice }) {
  const [timeframe, setTimeframe] = useState('1M');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/stocks/${symbol}/chart?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setChartData(data.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching chart data:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [symbol, timeframe]);

  // Calculate return over the selected timeframe
  const firstPrice = chartData.length > 0 ? chartData[0].price : currentPrice;
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : currentPrice;
  const timeframeReturn = lastPrice - firstPrice;
  const timeframeReturnPercent = firstPrice > 0 ? (timeframeReturn / firstPrice) * 100 : 0;
  const isPositive = timeframeReturn >= 0;

  const timeframes = ['1D', '1W', '1M', '1Y', '5Y'];

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Header & Timeframe Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Interactive Stock Price Trend
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Period Return ({timeframe}):
            </span>
            <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: isPositive ? 'var(--stock-green)' : 'var(--stock-red)' }}>
              {isPositive ? '+' : ''}${timeframeReturn.toFixed(2)} ({isPositive ? '+' : ''}{timeframeReturnPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="font-mono"
              style={{
                background: timeframe === tf ? 'var(--accent-primary)' : 'transparent',
                color: timeframe === tf ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div style={{ width: '100%', height: '340px', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
            <RefreshCw className="spin" size={24} color="var(--accent-primary)" /> Loading chart stream...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="var(--text-dim)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="var(--text-dim)" 
                fontSize={11} 
                domain={['auto', 'auto']} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#10b981' : '#f43f5e'} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
        <span>Showing price history data over {timeframe} timeframe</span>
        <span>Updated real-time • StockWise Data Engine</span>
      </div>

    </div>
  );
}

// Custom Tooltip Component for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{label}</div>
        <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          ${data.price.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Volume: {data.volume ? data.volume.toLocaleString() : 'N/A'}
        </div>
      </div>
    );
  }
  return null;
}
