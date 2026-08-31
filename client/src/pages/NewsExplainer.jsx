import { useState } from 'react';
import api from '../services/api';

// Alpha Vantage time_published format: YYYYMMDDTHHMMSS
function formatPublishedAt(value) {
  if (!value || typeof value !== 'string') return 'Unknown date';
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value.trim());
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NewsExplainer() {
  // `symbol` is ONLY the editable input value.
  const [symbol, setSymbol] = useState('');
  // `activeSymbol` is the symbol associated with the CURRENTLY DISPLAYED
  // article list. It is set only after a successful article fetch, and is
  // the ONLY symbol used when explaining an already-rendered article.
  const [activeSymbol, setActiveSymbol] = useState('');
  const [articles, setArticles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const fetchArticles = async (searchSymbol) => {
    const trimmed = searchSymbol.trim();
    if (!trimmed) {
      setListError({ message: 'Please enter a stock symbol' });
      setArticles(null);
      setActiveSymbol('');
      return;
    }

    const normalized = trimmed.toUpperCase();

    setLoading(true);
    setListError(null);
    setArticles(null);
    setExplanations({});
    setLoadingId(null);
    // Clear the previous active symbol at the start of a new search so stale
    // articles/explanations cannot be associated with the new search.
    setActiveSymbol('');

    try {
      const res = await api.get(`/news/symbol/${encodeURIComponent(normalized)}/articles`);
      setArticles(res.data.data.articles);
      // Associate the active symbol ONLY after a successful response.
      setActiveSymbol(normalized);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Something went wrong';

      let friendlyMessage = message;
      if (status === 401) {
        friendlyMessage = 'Authentication required. Please log in again.';
      } else if (status === 429) {
        friendlyMessage = 'Stock data provider rate limit reached. Please try again later.';
      } else if (status === 502) {
        friendlyMessage = 'News data provider error. Please try again later.';
      } else if (!err.response) {
        friendlyMessage = 'Network error — cannot reach the server.';
      }

      setListError({ message: friendlyMessage, status });
      setArticles(null);
      setActiveSymbol('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Guard against submission while a search OR an AI explanation is in
    // flight — this covers keyboard (Enter) submission, not just the
    // disabled button.
    if (loading || loadingId !== null) {
      return;
    }

    fetchArticles(symbol);
  };

  const handleExplain = async (articleId) => {
    // Per-article loading state — only one explanation at a time.
    setLoadingId(articleId);
    setExplanations((prev) => ({ ...prev, [articleId]: { loading: true } }));

    try {
      const res = await api.post('/news/explain', {
        // ALWAYS the symbol associated with the currently displayed article
        // list — never the current editable input value.
        symbol: activeSymbol,
        articleId,
      });
      setExplanations((prev) => ({
        ...prev,
        [articleId]: { explanation: res.data.data.explanation },
      }));
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Unable to explain this article';

      let friendlyMessage = message;
      if (status === 401) {
        friendlyMessage = 'Authentication required. Please log in again.';
      } else if (status === 404) {
        friendlyMessage = 'This article is no longer available for the requested symbol.';
      } else if (status === 500 && message === 'AI API key is not configured') {
        friendlyMessage = 'AI explanations are not configured on the server.';
      } else if (status === 500 && message === 'AI model is not configured') {
        friendlyMessage = 'AI model is not configured on the server.';
      } else if (status === 502 || status === 504) {
        friendlyMessage = message || 'AI explanation service is unavailable. Please try again later.';
      } else if (!err.response) {
        friendlyMessage = 'Network error — cannot reach the server.';
      }

      setExplanations((prev) => ({
        ...prev,
        [articleId]: { error: friendlyMessage },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="container news-explainer-container">
      <h1>Explain Market News</h1>
      <h2>Module 3 — Beginner Market News Explanation</h2>

      {/* Permanent educational disclaimer */}
      <div
        className="error-box"
        style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.08)' }}
      >
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          <strong>Educational tool only.</strong> Explanations are generated by AI to help you
          understand news terms and context. This is not investment advice, and nothing here is
          a buy/sell recommendation or price prediction.
        </p>
      </div>

      <form className="stock-search-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="news-symbol">Stock Symbol</label>
          <input
            id="news-symbol"
            type="text"
            placeholder="e.g. AAPL"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        {/* Disable search while loading articles OR while an AI explanation
            is in flight, so an old AI response cannot land in a newly
            searched article list. */}
        <button type="submit" className="btn" disabled={loading || loadingId !== null}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {listError && (
        <div className="error-box">
          <p className="error">{listError.message}</p>
        </div>
      )}

      {loading && <p>Loading recent news...</p>}

      {!loading && !listError && articles && articles.length === 0 && (
        <p>No recent news found for {activeSymbol}. Try another symbol.</p>
      )}

      {!loading && !listError && articles && articles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {articles.map((article) => {
            const state = explanations[article.id] || {};
            return (
              <div
                key={article.id}
                className="glass-card"
                style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}
              >
                <h3 style={{ marginBottom: '6px', fontSize: '1.05rem' }}>{article.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {article.source ? `Source: ${article.source}` : 'Source: Unknown'} ·{' '}
                  {formatPublishedAt(article.publishedAt)}
                </div>
                {article.summary && (
                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      marginBottom: '12px',
                    }}
                  >
                    {article.summary}
                  </p>
                )}
                <button
                  type="button"
                  className="btn"
                  disabled={loadingId !== null}
                  onClick={() => handleExplain(article.id)}
                >
                  {loadingId === article.id ? 'Explaining...' : 'Explain for Beginner'}
                </button>

                {state.loading && (
                  <p style={{ marginTop: '12px' }}>Generating beginner-friendly explanation...</p>
                )}

                {state.explanation && (
                  <div
                    className="explanation-panel"
                    style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(99, 102, 241, 0.06)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <h4 style={{ marginBottom: '8px' }}>In Simple Terms</h4>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {state.explanation.simpleExplanation}
                    </p>

                    {Array.isArray(state.explanation.keyTerms) &&
                      state.explanation.keyTerms.length > 0 && (
                        <>
                          <h4 style={{ margin: '12px 0 8px' }}>Key Terms</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {state.explanation.keyTerms.map((kt, i) => (
                              <li
                                key={`${article.id}-term-${i}`}
                                style={{ fontSize: '0.88rem', marginBottom: '4px' }}
                              >
                                <strong>{kt.term}:</strong> {kt.meaning}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                    <h4 style={{ margin: '12px 0 8px' }}>Why This May Matter</h4>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {state.explanation.whyItMayMatter}
                    </p>

                    <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '12px' }}>
                      AI-generated educational explanation based on the original article. Not
                      investment advice.
                    </p>
                  </div>
                )}

                {state.error && (
                  <div className="error-box" style={{ marginTop: '12px' }}>
                    <p className="error">{state.error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !listError && !articles && (
        <p>Enter a stock symbol above (e.g. AAPL) and click Search to load recent news.</p>
      )}
    </div>
  );
}
export default NewsExplainer;
