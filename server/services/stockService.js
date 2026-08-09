// StockService: composes Alpha Vantage provider data using the shared
// per-function cache (single-flight + global pacer + stale-on-429 fallback).
//
// KEY BEHAVIOR:
// - GET /api/stocks/:symbol  -> GLOBAL_QUOTE + OVERVIEW + TIME_SERIES_DAILY,
//   each cached independently and shared across /stocks, /company, /chart.
// - GET /api/stocks/:symbol/history -> fetches ONLY TIME_SERIES_DAILY
//   (never re-runs the full getStockBySymbol path).
// - A cache miss issues at most ONE Alpha Vantage call for that key, paced
//   through the shared scheduler. On rate-limit, fetchWithCache serves stale
//   cache within the bounded stale age, otherwise the 429 propagates.
// - No fabricated values. Catalog fallback is intentionally NOT used here
//   (this endpoint has no source marker); it remains only in the existing
//   /api/companies/:symbol/quote behavior.

const { fetchWithCache } = require('./alphaVantageCache');

const getApiKey = () => process.env.STOCK_API_KEY;
const getApiBaseUrl = () => process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query';

const normalizeSymbol = (symbol) => symbol.trim().toUpperCase();

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

  // Alpha Vantage rate-limit / quota response.
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

const fetchGlobalQuote = async (symbol) => {
  const body = await fetchAlphaVantage({
    function: 'GLOBAL_QUOTE',
    symbol,
  });

  const quote = body && body['Global Quote'];
  if (!quote || typeof quote !== 'object') {
    const error = new Error('Invalid or unknown stock symbol');
    error.statusCode = 404;
    error.code = 'STOCK_NOT_FOUND';
    throw error;
  }

  return {
    currentPrice: toNumber(quote['05. price']),
    dailyChange: toNumber(quote['09. change']),
    dailyChangePercent: toNumber(quote['10. change percent']),
    volume: toNumber(quote['06. volume']),
  };
};

const fetchOverview = async (symbol) => {
  const body = await fetchAlphaVantage({
    function: 'OVERVIEW',
    symbol,
  });

  // OVERVIEW returns an empty object {} for unknown symbols
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    const error = new Error('Invalid or unknown stock symbol');
    error.statusCode = 404;
    error.code = 'STOCK_NOT_FOUND';
    throw error;
  }

  return {
    name: body.Name || null,
    marketCap: toNumber(body.MarketCapitalization),
    week52High: toNumber(body['52WeekHigh']),
    week52Low: toNumber(body['52WeekLow']),
  };
};

const fetchDailyHistory = async (symbol) => {
  const body = await fetchAlphaVantage({
    function: 'TIME_SERIES_DAILY',
    symbol,
    outputsize: 'compact',
  });

  const series = body && body['Time Series (Daily)'];
  if (!series || typeof series !== 'object') {
    const error = new Error('Invalid or unknown stock symbol');
    error.statusCode = 404;
    error.code = 'STOCK_NOT_FOUND';
    throw error;
  }

  // Sort dates ascending
  const dates = Object.keys(series).sort((a, b) => new Date(a) - new Date(b));

  return dates.map((date) => {
    const day = series[date];
    return {
      date,
      open: toNumber(day['1. open']),
      high: toNumber(day['2. high']),
      low: toNumber(day['3. low']),
      close: toNumber(day['4. close']),
      volume: toNumber(day['5. volume']),
    };
  });
};

// Cache-wrapped provider fetchers. Each cache miss issues at most one
// Alpha Vantage call for that key via the shared paced scheduler;
// fetchWithCache handles single-flight dedup and stale-on-429 fallback.
const getQuote = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  return fetchWithCache(`quote:${normalized}`, () => fetchGlobalQuote(normalized));
};

const getOverview = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  return fetchWithCache(`overview:${normalized}`, () => fetchOverview(normalized));
};

const getDailyHistory = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  return fetchWithCache(`daily_history:${normalized}`, () => fetchDailyHistory(normalized));
};

const getStockBySymbol = async (symbol) => {
  const normalized = normalizeSymbol(symbol);

  // Compose from the shared per-function caches. On rate-limit with no
  // usable (fresh/stale) cache, the STOCK_PROVIDER_RATE_LIMIT error
  // propagates — no fabricated values, no catalog substitution here.
  const quote = await getQuote(normalized);
  const overview = await getOverview(normalized);
  const history = await getDailyHistory(normalized);

  return {
    symbol: normalized,
    name: overview.name,
    currentPrice: quote.currentPrice,
    dailyChange: quote.dailyChange,
    dailyChangePercent: quote.dailyChangePercent,
    volume: quote.volume,
    marketCap: overview.marketCap,
    week52High: overview.week52High,
    week52Low: overview.week52Low,
    history,
  };
};

const HISTORY_RANGES = {
  '1d': 1,
  '1w': 5,
  '1m': 22,
  '3m': 66,
  '1y': 252,
};

/**
 * Returns history for a symbol/range. This fetches ONLY the daily
 * time-series via the shared cache — it does NOT re-run the full
 * getStockBySymbol path (no GLOBAL_QUOTE / OVERVIEW calls).
 */
const getStockHistory = async (symbol, range) => {
  const normalized = normalizeSymbol(symbol);

  if (!HISTORY_RANGES[range]) {
    const error = new Error('Invalid history range. Use one of: 1d, 1w, 1m, 3m, 1y');
    error.statusCode = 400;
    error.code = 'INVALID_HISTORY_RANGE';
    throw error;
  }

  const history = await getDailyHistory(normalized);

  // Return the most recent N trading days
  const limit = HISTORY_RANGES[range];
  const sliced = history.slice(-limit);

  return {
    symbol: normalized,
    range,
    history: sliced,
  };
};

module.exports = {
  getStockBySymbol,
  getStockHistory,
};