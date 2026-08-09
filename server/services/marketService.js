// MarketService: composes Alpha Vantage market data using the shared
// per-function cache (single-flight + global pacer + stale-on-429 fallback).
//
// KEY BEHAVIOR:
// - TOP_GAINERS_LOSERS and each index GLOBAL_QUOTE are cached independently
//   and shared with the rest of the app via alphaVantageCache.js.
// - A cache miss issues at most ONE Alpha Vantage call for that key, paced
//   through the shared scheduler. On rate-limit, fetchWithCache serves stale
//   cache within the bounded stale age, otherwise the 429 propagates.
// - The /api/market/overview response shape is preserved exactly (no
//   injected source/cache metadata fields).

const { fetchWithCache } = require('./alphaVantageCache');

const getApiKey = () => process.env.STOCK_API_KEY;
const getApiBaseUrl = () => process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query';

/**
 * Fetch from Alpha Vantage and inspect both HTTP status and response body.
 * Alpha Vantage sometimes returns errors inside an HTTP 200 JSON response.
 */
const fetchAlphaVantage = async (params) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('Stock API key is not configured');
    error.statusCode = 500;
    error.code = 'STOCK_API_KEY_MISSING';
    throw error;
  }

  const url = new URL(getApiBaseUrl());
  url.searchParams.set('apikey', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url.toString());
  } catch (networkError) {
    const error = new Error('Failed to reach stock data provider');
    error.statusCode = 502;
    error.code = 'STOCK_PROVIDER_NETWORK_ERROR';
    error.cause = networkError;
    throw error;
  }

  let body;
  try {
    body = await response.json();
  } catch (parseError) {
    const error = new Error('Malformed response from stock data provider');
    error.statusCode = 502;
    error.code = 'STOCK_PROVIDER_MALFORMED_RESPONSE';
    error.cause = parseError;
    throw error;
  }

  // Alpha Vantage rate-limit / quota response
  const isRateLimitMessage = (text) =>
    typeof text === 'string' &&
    (/per second/i.test(text) ||
      /per day/i.test(text) ||
      /rate limit/i.test(text) ||
      /too many requests/i.test(text) ||
      /api call frequency/i.test(text));

  if (
    body &&
    typeof body === 'object' &&
    (body.Note || (body.Information && isRateLimitMessage(body.Information)))
  ) {
    const error = new Error('Stock data provider rate limit reached');
    error.statusCode = 429;
    error.code = 'STOCK_PROVIDER_RATE_LIMIT';
    throw error;
  }

  // Alpha Vantage informational / error message
  if (body && typeof body === 'object' && (body['Error Message'] || body.Information)) {
    const error = new Error('Stock data provider returned an error');
    error.statusCode = 502;
    error.code = 'STOCK_PROVIDER_ERROR';
    throw error;
  }

  // Non-2xx HTTP status with no recognized body
  if (!response.ok) {
    const error = new Error(`Stock data provider request failed with status ${response.status}`);
    error.statusCode = 502;
    error.code = 'STOCK_PROVIDER_HTTP_ERROR';
    throw error;
  }

  return body;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === 'None' || value === '') {
    return null;
  }
  // Alpha Vantage returns change percent as a string like "1.2345%"
  const cleaned = String(value).replace('%', '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

/**
 * Normalize a stock entry from the TOP_GAINERS_LOSERS API response.
 */
const normalizeMarketEntry = (entry) => ({
  symbol: entry.ticker || null,
  price: toNumber(entry.price),
  change: toNumber(entry.change_amount),
  changePercent: toNumber(entry.change_percentage),
  volume: toNumber(entry.volume),
});

/**
 * Fetch the top gainers, top losers, and most actively traded stocks
 * from Alpha Vantage's TOP_GAINERS_LOSERS endpoint.
 */
const fetchTopGainersLosers = async () => {
  const body = await fetchAlphaVantage({
    function: 'TOP_GAINERS_LOSERS',
  });

  if (!body || typeof body !== 'object') {
    const error = new Error('Invalid market overview response from data provider');
    error.statusCode = 502;
    error.code = 'MARKET_PROVIDER_INVALID_RESPONSE';
    throw error;
  }

  const topGainers = Array.isArray(body.top_gainers)
    ? body.top_gainers.map(normalizeMarketEntry)
    : [];

  const topLosers = Array.isArray(body.top_losers)
    ? body.top_losers.map(normalizeMarketEntry)
    : [];

  const mostActive = Array.isArray(body.most_actively_traded)
    ? body.most_actively_traded.map(normalizeMarketEntry)
    : [];

  return { topGainers, topLosers, mostActive };
};

/**
 * Major market-wide indicators to track for market movement.
 */
const MAJOR_INDICES = [
  { symbol: 'SPY', name: 'S&P 500 (SPY)' },
  { symbol: 'DIA', name: 'Dow Jones (DIA)' },
  { symbol: 'QQQ', name: 'NASDAQ-100 (QQQ)' },
];

/**
 * Fetch a global quote for a single index symbol.
 */
const fetchIndexQuote = async (symbol) => {
  const body = await fetchAlphaVantage({
    function: 'GLOBAL_QUOTE',
    symbol,
  });

  const quote = body && body['Global Quote'];
  if (!quote || typeof quote !== 'object') {
    return null;
  }

  return {
    symbol,
    price: toNumber(quote['05. price']),
    change: toNumber(quote['09. change']),
    changePercent: toNumber(quote['10. change percent']),
  };
};

// Cache-wrapped provider fetchers — all paced through the shared scheduler
// so different keys never fire Alpha Vantage requests simultaneously.
const getGainersLosers = async () =>
  fetchWithCache('gainers_losers', () => fetchTopGainersLosers());

const getIndexQuote = async (symbol) =>
  fetchWithCache(`index_quote:${symbol}`, () => fetchIndexQuote(symbol));

/**
 * Get the full market overview.
 * Composed from shared cached provider fetches; stale-on-429 fallback
 * handled inside fetchWithCache. Response shape preserved exactly.
 * Provider errors (including STOCK_PROVIDER_RATE_LIMIT) propagate when no
 * usable cache exists — no silent skipping, no fabricated index data.
 */
const getMarketOverview = async () => {
  const { topGainers, topLosers, mostActive } = await getGainersLosers();

  const majorMarketMovement = [];
  for (const index of MAJOR_INDICES) {
    const quote = await getIndexQuote(index.symbol);
    if (quote) {
      majorMarketMovement.push({
        ...quote,
        name: index.name,
      });
    }
  }

  return {
    topGainers,
    topLosers,
    mostActive,
    majorMarketMovement,
  };
};

module.exports = {
  getMarketOverview,
};