function formatPrice(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSigned(value) {
  if (value === null || value === undefined) return 'N/A';
  const formatted = formatPrice(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}$${formatted}`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'N/A';
  const formatted = formatPrice(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}${formatted}%`;
}

function PriceComparison({ currentPrice, history, rangeLabel }) {
  if (!history || history.length === 0) {
    return <p>No comparison data available.</p>;
  }

  // History is ascending (oldest first). Reference price is the first close.
  const referencePoint = history[0];
  const referencePrice = referencePoint.close;
  const referenceDate = referencePoint.date;

  const current = currentPrice;

  let difference = null;
  let percentChange = null;
  let direction = 'No Change';

  if (current !== null && current !== undefined && referencePrice !== null && referencePrice !== undefined) {
    difference = current - referencePrice;
    percentChange = referencePrice !== 0 ? (difference / referencePrice) * 100 : null;

    if (difference > 0) {
      direction = 'Increased';
    } else if (difference < 0) {
      direction = 'Decreased';
    } else {
      direction = 'No Change';
    }
  }

  const directionClass =
    direction === 'Increased' ? 'positive' : direction === 'Decreased' ? 'negative' : 'neutral';

  return (
    <div className="comparison-section">
      <div className="comparison-header">
        <h3>Historical Price Comparison</h3>
        <span className="comparison-period">
          {rangeLabel} · Reference date: {referenceDate}
        </span>
      </div>
      <div className="comparison-grid">
        <div className="comparison-card">
          <span className="stat-label">Current Price</span>
          <span className="stat-value">${formatPrice(current)}</span>
        </div>
        <div className="comparison-card">
          <span className="stat-label">Reference Price</span>
          <span className="stat-value">${formatPrice(referencePrice)}</span>
          <span className="stat-sub">at start of period</span>
        </div>
        <div className="comparison-card">
          <span className="stat-label">Absolute Difference</span>
          <span className="stat-value">{formatSigned(difference)}</span>
        </div>
        <div className="comparison-card">
          <span className="stat-label">Percentage Difference</span>
          <span className="stat-value">{formatPercent(percentChange)}</span>
        </div>
      </div>
      <div className={`comparison-direction ${directionClass}`}>
        Direction: <strong>{direction}</strong>
      </div>
    </div>
  );
}

export default PriceComparison;