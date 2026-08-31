import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/admin/reports');
        if (data && data.data) {
          setReports(data.data);
        }
      } catch (error) {
        console.error('Error fetching system reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading system reports & activity...</div>;
  }

  if (!reports) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Failed to load system reports.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="stock-grid">
        <div className="stock-stat">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{reports.totalTransactions}</span>
        </div>
        <div className="stock-stat">
          <span className="stat-label">Total Trading Volume</span>
          <span className="stat-value">${reports.totalVolume.toLocaleString()}</span>
        </div>
        <div className="stock-stat">
          <span className="stat-label">Active Users Tracked</span>
          <span className="stat-value">{reports.userLeaderboard.length}</span>
        </div>
      </div>

      <div className="history-table-wrapper">
        <h2>Top Users by Virtual Balance (Activity Monitoring)</h2>
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Virtual Balance</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.userLeaderboard.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}>{u.role}</span></td>
                <td><strong>${u.virtualBalance?.toLocaleString()}</strong></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="history-table-wrapper">
        <h2>Recent Global System Transactions</h2>
        {reports.recentTransactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)' }}>No transactions executed in the system yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>User</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {reports.recentTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td>{tx.user ? tx.user.name || tx.user.email : 'Unknown User'}</td>
                  <td><strong>{tx.symbol}</strong></td>
                  <td>
                    <span className={`badge ${tx.type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>{tx.quantity}</td>
                  <td>${tx.price?.toFixed(2)}</td>
                  <td><strong>${tx.total?.toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
