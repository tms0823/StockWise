// In-memory TTL cache: { [cacheKey]: { data, expiresAt } }
const cache = new Map();

const getApiKey = () => process.env.STOCK_API_KEY;
const getApiBaseUrl = () => process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query';
const getCacheTtlMs = () => Number(process.env.STOCK_CACHE_TTL_MS) || 300000;

const isCacheValid = (entry) => entry && entry.expiresAt > Date.now();

const getCached = (key) => {
  const entry = cache.get(key);
  if (isCacheValid(entry)) {
    return entry.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + getCacheTtlMs(),
  });
};

/**
 * Fetch from Alpha Vantage and inspect both HTTP status and response body.
 * Reuses the same error-handling patterns as stockService.
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

// Alpha Vantage free tier allows ~1 request per second and a small
// per-minute burst. Retry rate-limited provider responses with backoff,
// consistent with the existing stock service pattern.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRateLimitRetry = async (fn, retries = 3) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.code !== 'STOCK_PROVIDER_RATE_LIMIT') {
        throw error;
      }
      // Backoff: 2s, 4s, 8s
      await sleep(2000 * 2 ** attempt);
    }
  }
  throw lastError;
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
 * Alpha Vantage's GLOBAL_QUOTE does not support caret-prefixed index
 * symbols (e.g. ^GSPC), so we use the ETF equivalents that track the
 * major indices: SPY (S&P 500), DIA (Dow Jones), QQQ (NASDAQ-100).
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

/**
 * Fetch major market indices for market movement overview.
 * Fetches indices sequentially to respect Alpha Vantage rate limits.
 */
const fetchMajorMarketIndices = async () => {
  const results = [];
  for (const index of MAJOR_INDICES) {
    try {
      const quote = await fetchIndexQuote(index.symbol);
      if (quote) {
        results.push({
          ...quote,
          name: index.name,
        });
      }
    } catch {
      // If one index fails, continue to the next
    }
    // Rate-limit spacing: 1 second between calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return results;
};

/**
 * Get the full market overview.
 * Cached as a single entry to avoid repeated provider requests.
 */
const getMarketOverview = async () => {
  const cached = getCached('market_overview');
  if (cached) {
    return cached;
  }

  // Fetch gainers/losers/active and major indices in sequence.
  // Rate-limit retries keep the free-tier plan usable during bursts.
  const { topGainers, topLosers, mostActive } = await withRateLimitRetry(
    () => fetchTopGainersLosers(),
    2
  );

  // Wait before fetching indices (rate-limit spacing)
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const majorMarketMovement = await fetchMajorMarketIndices();

  const overview = {
    topGainers,
    topLosers,
    mostActive,
    majorMarketMovement,
  };

  setCache('market_overview', overview);
  return overview;
};

module.exports = {
  getMarketOverview,
};