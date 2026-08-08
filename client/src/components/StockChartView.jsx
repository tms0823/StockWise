import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function formatPrice(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatVolume(value) {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return formatPrice(value);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      <p>
        Open: <strong>${formatPrice(point.open)}</strong>
      </p>
      <p>
        High: <strong>${formatPrice(point.high)}</strong>
      </p>
      <p>
        Low: <strong>${formatPrice(point.low)}</strong>
      </p>
      <p>
        Close: <strong>${formatPrice(point.close)}</strong>
      </p>
      <p>
        Volume: <strong>{formatVolume(point.volume)}</strong>
      </p>
    </div>
  );
}

function StockChartView({ data }) {
  if (!data || data.length === 0) {
    return <p>No chart data available.</p>;
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => date.slice(5)}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${formatPrice(value)}`}
            width={70}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            name="Close"
            stroke="#1a73e8"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChartView;