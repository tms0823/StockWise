import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <h2>Welcome, {user.name}</h2>
      <div className="user-info">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Virtual Balance:</strong> {user.virtualBalance}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={() => navigate('/market-overview')}>
          Market Overview Dashboard
        </button>
        <button type="button" className="btn" onClick={() => navigate('/stocks')}>
          Live Stock Market Data
        </button>
        <button type="button" className="btn" onClick={() => navigate('/stocks/chart')}>
          Stock Chart & Comparison
        </button>
        <button type="button" className="btn" onClick={() => navigate('/search')}>
          Stock Search & Filter
        </button>
        <button type="button" className="btn" onClick={() => navigate('/dummy-investment')}>
          Dummy Investment
        </button>
        <button type="button" className="btn" onClick={() => navigate('/portfolio')}>
          My Portfolio
        </button>
        <button type="button" className="btn" onClick={() => navigate('/company/AAPL')}>
          Company Profile & Financial Indicators
        </button>
        <button type="button" className="btn" onClick={() => navigate('/learn/news-explainer')}>
          Explain Market News
        </button>
        <button type="button" className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;