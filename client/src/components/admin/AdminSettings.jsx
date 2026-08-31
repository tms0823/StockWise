import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminSettings = () => {
  const [weights, setWeights] = useState({
    financialPerformance: 20,
    priceStability: 15,
    dividendRecord: 15,
    debtLevel: 15,
    profitGrowth: 15,
    marketReputation: 10,
    newsSentiment: 10,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        if (data && data.data && data.data.reputationWeights) {
          setWeights(data.data.reputationWeights);
        }
      } catch (error) {
        console.error('Error fetching settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + Number(w || 0), 0);

  const handleWeightChange = (key, val) => {
    setWeights({
      ...weights,
      [key]: val === '' ? '' : Number(val)
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      alert(`Validation Error: Reputation weights must add up to exactly 100. Current total is ${totalWeight}`);
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/settings', {
        key: 'reputationWeights',
        value: weights
      });
      alert('Reputation scoring weights updated successfully!');
    } catch (error) {
      console.error('Error saving settings', error);
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading system settings...</div>;
  }

  return (
    <div className="auth-container" style={{ margin: '0 auto', maxWidth: '600px' }}>
      <h2 style={{ textAlign: 'center' }}>Reputation Scoring Rules</h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
        Adjust calculation weights for company reputation score factors. <br />
        <strong>Important:</strong> Total weights must equal exactly 100.
      </p>

      <form className="auth-form" onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div><strong>Factor Name</strong></div>
          <div style={{ textAlign: 'right' }}><strong>Weight (%)</strong></div>

          {Object.keys(weights).map((factor) => (
            <span key={factor} style={{ display: 'contents' }}>
              <label style={{ margin: 0, textTransform: 'capitalize', fontSize: '0.9rem' }}>
                {factor.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weights[factor]}
                onChange={(e) => handleWeightChange(factor, e.target.value)}
                style={{ textAlign: 'right', padding: '0.4rem' }}
                required
              />
            </span>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderRadius: '8px',
          background: totalWeight === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${totalWeight === 100 ? '#10b981' : '#ef4444'}`,
          marginBottom: '2rem'
        }}>
          <span>Total Weight:</span>
          <strong style={{ color: totalWeight === 100 ? '#10b981' : '#ef4444' }}>{totalWeight} / 100</strong>
        </div>

        <button type="submit" className="btn" disabled={saving || totalWeight !== 100}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
