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
  sector: body.Sector && body.Sector !== 'None' ? body.Sector : null,
  industry: body.Industry && body.Industry !== 'None' ? body.Industry : null,
  exchange: body.Exchange && body.Exchange !== 'None' ? body.Exchange : null,

  marketCap: toNumber(body.MarketCapitalization),
  week52High: toNumber(body['52WeekHigh']),
  week52Low: toNumber(body['52WeekLow']),

  peRatio: toNumber(body.PERatio),
  eps: toNumber(body.EPS),
  dividendYield: toNumber(body.DividendYield),
  revenueGrowth: toNumber(body.QuarterlyRevenueGrowthYOY),
  earningsGrowthYoY: toNumber(body.QuarterlyEarningsGrowthYOY),
  profitMargin: toNumber(body.ProfitMargin),
  operatingMargin: toNumber(body.OperatingMarginTTM),
  beta: toNumber(body.Beta),

  debtToEquity: Object.prototype.hasOwnProperty.call(body, 'DebtToEquityTTM')
    ? toNumber(body.DebtToEquityTTM)
    : null,

  analystRatingStrongBuy: toNumber(body.AnalystRatingStrongBuy),
  analystRatingBuy: toNumber(body.AnalystRatingBuy),
  analystRatingHold: toNumber(body.AnalystRatingHold),
  analystRatingSell: toNumber(body.AnalystRatingSell),
  analystRatingStrongSell: toNumber(body.AnalystRatingStrongSell),
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

/**
 * Fetch raw dividend history from the Alpha Vantage DIVIDENDS endpoint.
 * Reuses the existing fetchAlphaVantage (same key/base URL/error handling).
 */
const fetchDividends = async (symbol) => {
  return fetchAlphaVantage({
    function: 'DIVIDENDS',
    symbol,
  });
};

const isCompleteDate = (value) => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Reject impossible calendar dates (e.g. 2023-02-30) rather than guessing.
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

/**
 * Parse a dividend per-share amount.
 *
 * The verified Alpha Vantage `amount` field is a numeric string. We also
 * accept an already-numeric finite value. No broad Number(value) coercion
 * on arbitrary types: booleans, arrays, objects and other types => null.
 */
const parseAmount = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  return null;
};

/**
 * Normalize a raw Alpha Vantage DIVIDENDS response into the pure dividend
 * scoring contract.
 *
 * Verified real response shape:
 *   { symbol: string, data: Array<{
 *       ex_dividend_date: string,   // YYYY-MM-DD
 *       declaration_date: string,
 *       record_date: string,
 *       payment_date: string,
 *       amount: string              // per-share amount
 *     }> }
 *
 * Only ex_dividend_date and amount are used for scoring.
 *
 * Contract:
 *   {
 *     state: 'ok' | 'unavailable',
 *     completeYears: [YYYY, YYYY, YYYY],
 *     yearlyTotals: { YYYY: number, YYYY: number, YYYY: number },
 *     reason?: string
 *   }
 *
 * Uses the previous THREE COMPLETE calendar years based on `now`.
 * Example in 2026: [2023, 2024, 2025]. Current-year rows are ignored.
 */
const normalizeDividendHistory = (rawBody, now = new Date()) => {
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) {
    throw new Error('normalizeDividendHistory: invalid "now" argument');
  }
  const currentYear = nowDate.getUTCFullYear();

  const completeYears = [
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
  ];

  const emptyTotals = {
    [completeYears[0]]: 0,
    [completeYears[1]]: 0,
    [completeYears[2]]: 0,
  };

  // Provider validation.
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return {
      state: 'unavailable',
      completeYears,
      yearlyTotals: emptyTotals,
      reason: 'Malformed dividend history data',
    };
  }

  const data = rawBody.data;
  if (!Array.isArray(data)) {
    return {
      state: 'unavailable',
      completeYears,
      yearlyTotals: emptyTotals,
      reason: 'Malformed dividend history data',
    };
  }

  if (data.length === 0) {
    return {
      state: 'unavailable',
      completeYears,
      yearlyTotals: emptyTotals,
      reason: 'Dividend history coverage cannot be confirmed',
    };
  }

  // Validate EVERY record first. If any record is malformed, the whole
  // history is unavailable — no early break, no unvalidated rows used.
  const validRecords = [];
  for (const record of data) {
    const date = record && record.ex_dividend_date;
    const amount = record && record.amount;

    if (!isCompleteDate(date) || parseAmount(amount) === null) {
      return {
        state: 'unavailable',
        completeYears,
        yearlyTotals: emptyTotals,
        reason: 'Malformed dividend history data',
      };
    }

    validRecords.push({
      exDate: new Date(`${date}T00:00:00Z`),
      amount: parseAmount(amount),
    });
  }

  // Coverage rule: require at least one valid record before the oldest
  // complete year, so a zero year inside the window is a genuine
  // no-payment year rather than a coverage gap.
  const oldestYearStart = Date.UTC(completeYears[0], 0, 1);
  const hasCoverage = validRecords.some((r) => r.exDate.getTime() < oldestYearStart);

  if (!hasCoverage) {
    return {
      state: 'unavailable',
      completeYears,
      yearlyTotals: emptyTotals,
      reason: 'Insufficient dividend history coverage',
    };
  }

  // Coverage confirmed: initialize all three yearly totals to 0. A missing
  // year inside confirmed coverage is a genuine 0-payment year.
  const yearlyTotals = {
    [completeYears[0]]: 0,
    [completeYears[1]]: 0,
    [completeYears[2]]: 0,
  };

  for (const record of validRecords) {
    const year = record.exDate.getUTCFullYear();
    if (Object.prototype.hasOwnProperty.call(yearlyTotals, String(year))) {
      yearlyTotals[year] += record.amount;
    }
  }

  // Round each total to 6 decimals to clear floating-point noise; do not
  // discard legitimate precision.
  for (const year of completeYears) {
    yearlyTotals[year] = Math.round(yearlyTotals[year] * 1e6) / 1e6;
  }

  return {
    state: 'ok',
    completeYears,
    yearlyTotals,
  };
};

// Dividend history changes slowly (~24h fresh TTL; bounded stale fallback
// is 2 * 24h = 48h through the shared cache).
const DIVIDEND_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

/**
 * Cache-wrapped dividend history fetch.
 *
 * - Caches the RAW provider response, then normalizes it afterward.
 * - Cache key: dividends:<NORMALIZED_SYMBOL>.
 * - Uses the 24-hour TTL override; the existing quote/overview/history
 *   wrappers are untouched and keep the default TTL.
 */
const getDividends = async (symbol) => {
  const normalized = normalizeSymbol(symbol);

  const rawBody = await fetchWithCache(
    `dividends:${normalized}`,
    () => fetchDividends(normalized),
    { ttlMs: DIVIDEND_CACHE_TTL_MS }
  );

  return normalizeDividendHistory(rawBody);
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

  sector: overview.sector,
  industry: overview.industry,
  exchange: overview.exchange,

  indicators: {
    peRatio: overview.peRatio,
    eps: overview.eps,
    dividendYield: overview.dividendYield,
    revenueGrowth: overview.revenueGrowth,
    epsGrowthYoY: overview.earningsGrowthYoY,
    debtToEquity: overview.debtToEquity,
    profitMargin: overview.profitMargin,
    operatingMargin: overview.operatingMargin,
    beta: overview.beta,
    analystRatingStrongBuy: overview.analystRatingStrongBuy,
    analystRatingBuy: overview.analystRatingBuy,
    analystRatingHold: overview.analystRatingHold,
    analystRatingSell: overview.analystRatingSell,
    analystRatingStrongSell: overview.analystRatingStrongSell,
  },

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
  getDividends,
  normalizeDividendHistory,
  getQuote,
};
