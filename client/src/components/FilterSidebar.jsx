import { useState } from 'react';

const RISK_LEVEL_ORDER = ['Low', 'Medium', 'High'];
const MARKET_TYPE_ORDER = ['Large-cap', 'Mid-cap', 'Small-cap'];
const REPUTATION_ORDER = ['Blue-chip', 'Established', 'Emerging', 'Penny Stock'];

const orderBy = (values, order) => {
  if (!values) return [];
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

function FilterSection({ icon, label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="filter-section">
      <button
        type="button"
        className="filter-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="filter-section-title">
          <span className="filter-section-icon" aria-hidden="true">
            {icon}
          </span>
          {label}
        </span>
        <span className={`filter-section-chevron${open ? ' open' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>
      <div className={`filter-section-body${open ? ' open' : ''}`}>
        <div className="filter-section-inner">{children}</div>
      </div>
    </div>
  );
}

function FilterSidebar({ filters, onFilterChange, onClear, filterOptions, activeCount, sort, onSortChange }) {
  const sectors = filterOptions?.sectors || [];
  const marketTypes = orderBy(filterOptions?.marketTypes, MARKET_TYPE_ORDER);
  const reputationStatuses = orderBy(filterOptions?.reputationStatuses, REPUTATION_ORDER);
  const riskLevels = orderBy(filterOptions?.riskLevels, RISK_LEVEL_ORDER);

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-heading">
        <h3>Filters</h3>
        {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
      </div>

      <FilterSection icon="💼" label="Sector">
        <select value={filters.sector} onChange={(e) => onFilterChange('sector', e.target.value)}>
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection icon="💲" label="Price Range">
        <div className="price-range-inputs">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="$0"
            value={filters.minPrice}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            aria-label="Minimum price"
          />
          <span className="price-range-sep">—</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            aria-label="Maximum price"
          />
        </div>

        <div className="price-sort-label">Sort by price</div>
        <div className="pill-option-group">
          <button
            type="button"
            className={`pill-option${sort.sortBy === 'price' && sort.sortOrder === 'asc' ? ' selected' : ''}`}
            onClick={() => onSortChange({ sortBy: 'price', sortOrder: 'asc' })}
          >
            Low to High
          </button>
          <button
            type="button"
            className={`pill-option${sort.sortBy === 'price' && sort.sortOrder === 'desc' ? ' selected' : ''}`}
            onClick={() => onSortChange({ sortBy: 'price', sortOrder: 'desc' })}
          >
            High to Low
          </button>
        </div>
      </FilterSection>

      <FilterSection icon="🏛️" label="Market Type">
        <select
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
      </FilterSection>

      <FilterSection icon="🎖️" label="Reputation Status">
        <select
          value={filters.reputationStatus}
          onChange={(e) => onFilterChange('reputationStatus', e.target.value)}
        >
          <option value="">All tiers</option>
          {reputationStatuses.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection icon="🛡️" label="Risk Level">
        <div className="pill-option-group">
          {riskLevels.map((r) => (
            <button
              key={r}
              type="button"
              className={`pill-option${filters.riskLevel === r ? ' selected' : ''}`}
              onClick={() => onFilterChange('riskLevel', filters.riskLevel === r ? '' : r)}
            >
              {r}
            </button>
          ))}
        </div>
      </FilterSection>

      <button type="button" className="reset-filters-btn" onClick={onClear} disabled={activeCount === 0}>
        Reset filters
      </button>
    </aside>
  );
}

export default FilterSidebar;
