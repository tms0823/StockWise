import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CueCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCueCards = async () => {
      setLoading(true);
      setError(null);

      try {
        // Authenticated users get the full set; visitors get a limited preview.
        const endpoint = user ? '/cue-cards' : '/cue-cards/preview';
        const response = await api.get(endpoint);
        if (!cancelled) {
          setCards(response.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.message || err.message || 'Something went wrong';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCueCards();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="container cue-cards-container">
      <h1>StockWise Learning</h1>
      <h2>Stock Market Basics — Cue Cards</h2>
      <p className="cue-cards-intro">
        Learn the basics of stock market investing with these short, simple
        beginner-friendly cue cards.
      </p>

      {!user && (
        <div className="cue-cards-preview-banner">
          <p>
            You are viewing a limited preview.{' '}
            <Link to="/register">Register</Link> or{' '}
            <Link to="/login">log in</Link> to access all cue cards.
          </p>
        </div>
      )}

      {loading && <p>Loading cue cards...</p>}

      {error && (
        <div className="error-box">
          <p className="error">{error}</p>
        </div>
      )}

      {!loading && !error && cards && (
        <div className="cue-cards-grid">
          {cards.map((card) => (
            <div className="cue-card" key={card.topic}>
              <h3 className="cue-card-topic">{card.topic}</h3>
              <p className="cue-card-definition">{card.definition}</p>
              {card.example && (
                <p className="cue-card-example">
                  <strong>Example:</strong> {card.example}
                </p>
              )}
              <Link to={`/quiz/${encodeURIComponent(card.topic)}`}>
                Take the quiz
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && cards && cards.length === 0 && (
        <p>No cue cards are available right now.</p>
      )}

      <div className="cue-cards-disclaimer">
        <p>
          These materials are for educational purposes only and are not
          financial advice. Always do your own research before making
          investment decisions.
        </p>
      </div>
    </div>
  );
}

export default CueCards;