import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <h1>StockWise</h1>
      <h2>Real-Time Stock Market Investment Support System</h2>
      <p>
        Learn, analyse, and practise stock market investment using real-time
        market information.
      </p>
      {user ? (
        <>
          <p>
            Welcome, <strong>{user.name}</strong>!
          </p>
          <Link to="/dashboard" className="btn">
            Dashboard
          </Link>{' '}
          <button type="button" className="btn" onClick={logout}>
            Logout
          </button>{' '}
          <Link to="/test" className="btn">
            Test Server Connection
          </Link>{' '}
          <Link to="/learn/cue-cards" className="btn">
            Learn Stock Basics
          </Link>
        </>
      ) : (
        <>
          <Link to="/register" className="btn">
            Register
          </Link>{' '}
          <Link to="/login" className="btn">
            Login
          </Link>{' '}
          <Link to="/test" className="btn">
            Test Server Connection
          </Link>{' '}
          <Link to="/learn/cue-cards" className="btn">
            Learn Stock Basics
          </Link>
        </>
      )}
    </div>
  );
}

export default Home;