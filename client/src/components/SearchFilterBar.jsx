const RISK_LEVEL_ORDER = ['Low', 'Medium', 'High'];
const MARKET_TYPE_ORDER = ['Large-cap', 'Mid-cap', 'Small-cap'];
const REPUTATION_ORDER = ['Blue-chip', 'Established', 'Emerging', 'Penny Stock'];

const orderBy = (values, order) => {
  if (!values) return [];
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

function SearchFilterBar({ query, onQueryChange, filters, onFilterChange, onClear, filterOptions }) {
  const sectors = filterOptions?.sectors || [];
  const marketTypes = orderBy(filterOptions?.marketTypes, MARKET_TYPE_ORDER);
  const reputationStatuses = orderBy(filterOptions?.reputationStatuses, REPUTATION_ORDER);
  const riskLevels = orderBy(filterOptions?.riskLevels, RISK_LEVEL_ORDER);

  const hasActiveFilters =
    query ||
    filters.sector ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.marketType ||
    filters.reputationStatus ||
    filters.riskLevel;

  return (
    <div className="search-filter-bar">
      <div className="form-group search-input-group">
        <label htmlFor="company-search">Search by company name or symbol</label>
        <input
          id="company-search"
          type="text"
          placeholder="e.g. Apple or AAPL"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <div className="filter-grid">
        <div className="form-group">
          <label htmlFor="filter-sector">Sector</label>
          <select
            id="filter-sector"
            value={filters.sector}
            onChange={(e) => onFilterChange('sector', e.target.value)}
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filter-min-price">Min price</label>
          <input
            id="filter-min-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filter-max-price">Max price</label>
          <input
            id="filter-max-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filter-market-type">Market type</label>
          <select
            id="filter-market-type"
            value={filters.marketType}
            onChange={(e) => onFilterChange('marketType', e.target.value)}
          >
            <option value="">All market types</option>
            {marketTypes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filter-reputation">Reputation status</label>
          <select
            id="filter-reputation"
            value={filters.reputationStatus}
            onChange={(e) => onFilterChange('reputationStatus', e.target.value)}
          >
            <option value="">All reputation levels</option>
            {reputationStatuses.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filter-risk">Risk level</label>
          <select
            id="filter-risk"
            value={filters.riskLevel}
            onChange={(e) => onFilterChange('riskLevel', e.target.value)}
          >
            <option value="">All risk levels</option>
            {riskLevels.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" className="btn btn-secondary clear-filters-btn" onClick={onClear}>
          Clear search & filters
        </button>
      )}
    </div>
  );
}

export default SearchFilterBar;
