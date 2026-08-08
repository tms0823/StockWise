import { useState, useEffect } from 'react';
import { searchCompanies, getCompanyFilterOptions } from '../services/companyService';
import SearchFilterBar from '../components/SearchFilterBar';
import CompanyResultsList from '../components/CompanyResultsList';
import '../styles/stockSearch.css';

const EMPTY_FILTERS = {
  sector: '',
  minPrice: '',
  maxPrice: '',
  marketType: '',
  reputationStatus: '',
  riskLevel: '',
};

const DEBOUNCE_MS = 400;
const PAGE_LIMIT = 20;

function StockSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState(null);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCompanyFilterOptions()
      .then((res) => setFilterOptions(res.data.data))
      .catch(() => setFilterOptions(null));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchCompanies({ q: query, ...filters, page, limit: PAGE_LIMIT })
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
  }, [query, filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setQuery('');
    setFilters(EMPTY_FILTERS);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  return (
    <div className="container search-container">
      <h1>Stock Search & Filter</h1>
      <h2>Module 1 — Feature 3</h2>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        filterOptions={filterOptions}
      />

      {error && (
        <div className="error-box">
          <p className="error">{error.message}</p>
        </div>
      )}

      {loading ? (
        <p>Loading companies...</p>
      ) : (
        !error && (
          <>
            <p className="results-count">
              {total} compan{total === 1 ? 'y' : 'ies'} found
            </p>
            <CompanyResultsList results={results} />

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

export default StockSearch;
