import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminUsers from '../components/admin/AdminUsers';
import AdminCueCards from '../components/admin/AdminCueCards';
import AdminQuizzes from '../components/admin/AdminQuizzes';
import AdminReports from '../components/admin/AdminReports';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [metrics, setMetrics] = useState({ users: 0, cueCards: 0, quizQuestions: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/admin/metrics');
        if (data && data.data) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching metrics', error);
      }
    };
    fetchMetrics();
  }, [activeTab]);

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <p>System Overview, Content Management & Reports</p>

      <div className="stock-grid" style={{ marginBottom: '2rem' }}>
        <div className="stock-stat">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{metrics.users}</span>
        </div>
        <div className="stock-stat">
          <span className="stat-label">Cue Cards</span>
          <span className="stat-value">{metrics.cueCards}</span>
        </div>
        <div className="stock-stat">
          <span className="stat-label">Quiz Questions</span>
          <span className="stat-value">{metrics.quizQuestions}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Users</button>
        <button className={`btn ${activeTab === 'cuecards' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('cuecards')}>Cue Cards</button>
        <button className={`btn ${activeTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('quizzes')}>Quiz Questions</button>
        <button className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('reports')}>System Reports</button>
        <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('settings')}>Scoring Rules</button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'cuecards' && <AdminCueCards />}
        {activeTab === 'quizzes' && <AdminQuizzes />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboard;
