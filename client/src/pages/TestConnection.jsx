import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function TestConnection() {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get('/health');
        setData(response.data);
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="container">
      <h1>Test Server Connection</h1>

      {status === 'loading' && <p>Connecting to StockWise Server...</p>}

      {status === 'success' && (
        <>
          <p className="success">✓ StockWise API is running</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
      )}

      {status === 'error' && (
        <p className="error">✗ Unable to connect to StockWise API</p>
      )}

      <Link to="/" className="btn">
        Back to Home
      </Link>
    </div>
  );
}

export default TestConnection;