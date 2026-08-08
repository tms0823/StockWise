import { useState, useEffect } from 'react';
import { searchCompanies, getCompanyFilterOptions } from '../services/companyService';
import FilterSidebar from '../components/FilterSidebar';
import CompanyResultsTable from '../components/CompanyResultsTable';
import '../styles/stockSearch.css';

const EMPTY_FILTERS = {
  sector: '',
  minPrice: '',
  maxPrice: '',
  marketType: '',
  reputationStatus: '',
  riskLevel: '',
};

const DEBOUNCE_MS = 350;
const PAGE_LIMIT = 20;

function StockSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ sortBy: 'symbol', sortOrder: 'asc' });
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState(null);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCompanyFilterOptions()
      .then((res) => setFilterOptions(res.data.data))
      .catch(() => setFilterOptions(null));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, filters, sort]);

  useEffect(() => {
    let cancelled = false;
    setIsTyping(true);
    setError(null);

    const timer = setTimeout(() => {
      setIsTyping(false);
      setLoading(true);
      searchCompanies({ q: query, ...filters, ...sort, page, limit: PAGE_LIMIT })
        .then((res) => {
          if (cancelled) return;
          setResults(res.data.data.results);
          setTotal(res.data.data.total);
        })
        .catch((err) => {
          if (cancelled) return;
          const status = err.response?.status;
          const message = err.response?.data?.message || err.message || 'Something went wrong';

          let friendlyMessage = message;
          if (status === 401) {
            friendlyMessage = 'Authentication required. Please log in again.';
          } else if (!err.response) {
            friendlyMessage = 'Network error — cannot reach the server.';
          }

          setError({ message: friendlyMessage, status });
          setResults([]);
          setTotal(0);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filters, sort, page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const showSkeleton = loading && results.length === 0;

  return (
    <div className="search-page">
      <div className="screener-layout">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          filterOptions={filterOptions}
          activeCount={activeFilterCount}
          sort={sort}
          onSortChange={setSort}
        />

        <div className="screener-main">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="company-search"
              type="text"
              placeholder="Search AAPL or Apple..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            {isTyping && <span className="search-spinner" aria-hidden="true" />}
            {query && !isTyping && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {error && (
            <div className="error-box">
              <p className="error">{error.message}</p>
            </div>
          )}

          {!error && (
            <div className="catalog-card">
              <div className="catalog-card-header">
                <span className="catalog-label">Stock Catalog</span>
                <span className="results-count">
                  {loading ? 'Searching…' : `${total} compan${total === 1 ? 'y' : 'ies'} found`}
                </span>
              </div>

              <CompanyResultsTable results={results} loading={showSkeleton} sort={sort} onSortChange={setSort} />

              {!showSkeleton && totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Previous
                  </button>
                  <span className="pagination-label">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockSearch;
