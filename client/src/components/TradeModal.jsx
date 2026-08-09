import React, { useState } from 'react';
import { DollarSign, ShoppingCart, AlertCircle, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';

export default function TradeModal({ 
  stock, 
  isOpen, 
  onClose, 
  portfolioBalance, 
  onExecuteTrade 
}) {
  if (!isOpen || !stock) return null;

  const [shares, setShares] = useState(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pricePerShare = stock.price;
  const totalCost = parseFloat((shares * pricePerShare).toFixed(2));
  const remainingBalance = portfolioBalance - totalCost;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (shares <= 0) return;

    if (totalCost > portfolioBalance) {
      setErrorMsg(`Insufficient funds! Total cost ($${totalCost.toLocaleString()}) exceeds your balance.`);
      return;
    }

    setErrorMsg('');
    setLoading(true);

    fetch('/api/portfolio/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: stock.symbol, shares })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setSuccessMsg(data.message);
          onExecuteTrade(data.portfolio);
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1800);
        } else {
          setErrorMsg(data.error || 'Failed to process dummy investment');
        }
      })
      .catch(err => {
        setLoading(false);
        setErrorMsg('Network error executing trade');
      });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '28px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <ShoppingCart size={22} color="var(--stock-green)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Practice Dummy Investment
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Simulate stock trade with virtual funds</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.4rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="badge badge-green" style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: 'var(--radius-sm)', justifyContent: 'center', fontSize: '0.88rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="badge badge-red" style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: 'var(--radius-sm)', justifyContent: 'center', fontSize: '0.85rem' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* Stock Overview Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-indigo font-mono" style={{ fontSize: '0.8rem' }}>{stock.symbol}</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              {stock.name}
            </div>
          </div>
          <div className="font-mono" style={{ textAlign: 'right', fontSize: '1.3rem', fontWeight: 800, color: 'var(--stock-green)' }}>
            ${pricePerShare.toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Shares Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Number of Shares to Buy:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="1"
                max="10000"
                className="search-input font-mono"
                style={{ paddingLeft: '16px', fontSize: '1.1rem', fontWeight: 700 }}
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button 
                type="button" 
                onClick={() => setShares(10)} 
                className="btn btn-secondary" 
                style={{ padding: '0 14px', fontSize: '0.8rem' }}
              >
                10 Shares
              </button>
              <button 
                type="button" 
                onClick={() => setShares(50)} 
                className="btn btn-secondary" 
                style={{ padding: '0 14px', fontSize: '0.8rem' }}
              >
                50 Shares
              </button>
            </div>
          </div>

          {/* Trade Cost Breakdown */}
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '24px', fontSize: '0.85rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Available Virtual Balance:</span>
              <span className="font-mono" style={{ color: 'var(--text-main)' }}>${portfolioBalance.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Total Estimated Cost ({shares} shares):</span>
              <span className="font-mono" style={{ color: 'var(--stock-green)', fontWeight: 700 }}>${totalCost.toLocaleString()}</span>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: remainingBalance >= 0 ? 'var(--text-dim)' : 'var(--stock-red)' }}>
              <span>Balance After Purchase:</span>
              <span className="font-mono" style={{ fontWeight: 700 }}>
                ${remainingBalance >= 0 ? remainingBalance.toLocaleString() : 'Insufficient Cash'}
              </span>
            </div>

          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-success" 
              style={{ flex: 2, padding: '12px' }}
              disabled={loading || remainingBalance < 0}
            >
              {loading ? 'Processing Trade...' : 'Execute Buy Order'} <ArrowRight size={18} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
