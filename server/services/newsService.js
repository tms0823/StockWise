// NewsService: provides normalized company news articles for the Module 3
// Beginner Market News Explanation feature.
//
// KEY BEHAVIOR:
// - Reuses the existing Alpha Vantage NEWS_SENTIMENT raw-response cache via
//   the additive getRawNewsSentiment() in stockService.js — the SAME cache
//   key (`news_sentiment:<SYMBOL>`) and the SAME 30-minute TTL, so the
//   Company Reputation Score and this feature share ONE provider response
//   and never issue duplicate NEWS_SENTIMENT calls for the same symbol.
// - normalizeNewsArticles() is a SEPARATE normalizer from
//   normalizeNewsSentiment() in stockService.js. It reads ONLY article
//   fields (title, summary, url, source, time_published) and NEVER reads
//   ticker_sentiment / sentiment scores, so the Reputation News Sentiment
//   contract is untouched.
// - Articles are identified by a deterministic id derived from title+url,
//   so the frontend can reference a provider-backed article WITHOUT sending
//   arbitrary article text back to the backend. The backend always resolves
//   the article from the cached provider response.
//
// ERROR CONTRACT:
// - Malformed provider data (non-object rawBody, or feed not an array)
//   THROWS a controlled 502 'NEWS_PROVIDER_MALFORMED' error — it is a
//   provider/format problem, not an ordinary empty result.
// - A valid feed array with zero USABLE articles is a NORMAL empty result,
//   NOT an error. getNewsArticles() returns { symbol, articles: [] }.

const crypto = require('crypto');
const { getRawNewsSentiment } = require('./stockService');

const normalizeSymbol = (symbol) => {
  if (typeof symbol !== 'string') {
    return String(symbol || '').trim().toUpperCase();
  }
  return symbol.trim().toUpperCase();
};

/**
 * Create a stable, deterministic article id from the provider title and url.
 * The same article (same title+url) always yields the same id, so a client
 * can request an explanation using only this id.
 */
const makeArticleId = (title, url) => {
  const base = `${String(title || '')}|${String(url || '')}`;
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 24);
};

/**
 * Keep only non-empty trimmed strings; anything else becomes null.
 */
const toArticleString = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
};

/**
 * Throw a controlled provider-format error (used only for malformed
 * provider responses, never for ordinary empty article lists).
 */
const throwMalformedNews = () => {
  const error = new Error('News data provider returned an unexpected response');
  error.statusCode = 502;
  error.code = 'NEWS_PROVIDER_MALFORMED';
  throw error;
};

/**
 * Normalize a raw Alpha Vantage NEWS_SENTIMENT response into a clean list of
 * displayable articles.
 *
 * Contract:
 *   {
 *     status: 'ok' | 'unavailable',
 *     symbol: string,
 *     articles: Array<{
 *       id: string,
 *       title: string,
 *       summary: string|null,
 *       url: string,
 *       source: string|null,
 *       publishedAt: string|null
 *     }>,
 *     reason?: string
 *   }
 *
 * Throws (502 NEWS_PROVIDER_MALFORMED) when:
 *   - rawBody is not a plain object, OR
 *   - rawBody.feed is not an array.
 *
 * Returns status:'unavailable' with articles:[] when:
 *   - the feed is a valid array but contains zero usable articles.
 *
 * Rules:
 * - Malformed article RECORDS within a valid array are SKIPPED, never crash
 *   the whole list.
 * - title and url are required for an article to be usable.
 * - summary / source / publishedAt are optional and normalized to null.
 * - This normalizer NEVER reads ticker_sentiment or sentiment scores.
 */
const normalizeNewsArticles = (rawBody, symbol) => {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throwMalformedNews();
  }

  const feed = rawBody.feed;
  if (!Array.isArray(feed)) {
    throwMalformedNews();
  }

  const articles = [];
  for (const item of feed) {
  if (!item || typeof item !== 'object') {
    continue;
  }

  const tickerSentiment = Array.isArray(item.ticker_sentiment)
    ? item.ticker_sentiment
    : [];

  const primaryTicker = tickerSentiment.reduce((best, entry) => {
  if (!entry || typeof entry !== 'object') {
    return best;
  }

  const ticker = normalizeSymbol(entry.ticker);
  const relevanceScore = Number.parseFloat(entry.relevance_score);

  if (!ticker || !Number.isFinite(relevanceScore)) {
    return best;
  }

  if (!best || relevanceScore > best.relevanceScore) {
    return { ticker, relevanceScore };
  }

  return best;
}, null);

if (!primaryTicker || primaryTicker.ticker !== normalizedSymbol) {
  continue;
}

  const title = toArticleString(item.title);
  const url = toArticleString(item.url);
    if (!title || !url) {
      // Without a title and url the article card is not meaningful.
      continue;
    }

    articles.push({
      id: makeArticleId(title, url),
      title,
      summary: toArticleString(item.summary),
      url,
      source: toArticleString(item.source),
      publishedAt: toArticleString(item.time_published),
    });
  }

  if (articles.length === 0) {
    return {
      status: 'unavailable',
      symbol: normalizedSymbol,
      articles: [],
      reason: 'No usable news articles',
    };
  }

  return {
    status: 'ok',
    symbol: normalizedSymbol,
    articles,
  };
};

/**
 * Public endpoint contract for the article list endpoint.
 * Returns only the displayable article list — no sentiment fields.
 *
 * - Malformed provider data propagates the 502 NEWS_PROVIDER_MALFORMED.
 * - A valid feed with zero usable articles is a NORMAL empty list:
 *   { symbol, articles: [] }.
 */
const getNewsArticles = async (symbol) => {
  const rawBody = await getRawNewsSentiment(symbol);
  const normalized = normalizeNewsArticles(rawBody, symbol);
  return {
    symbol: normalized.symbol,
    articles: normalized.articles,
  };
};

/**
 * Resolve a single provider-backed article by its deterministic id.
 *
 * The article is ALWAYS re-read from the cached Alpha Vantage NEWS_SENTIMENT
 * raw response — the backend never trusts article text supplied by the
 * frontend.
 *
 * - articleId is validated FIRST, before any provider call, so an invalid
 *   id returns null without touching the cache/provider.
 * - Malformed provider data propagates the 502 NEWS_PROVIDER_MALFORMED.
 * - Returns null ONLY when the provider response is valid but the requested
 *   articleId does not exist (the controller turns that into a controlled
 *   404/400 error).
 */
const findArticleById = async (symbol, articleId) => {
  if (typeof articleId !== 'string' || !articleId.trim()) {
    return null;
  }

  const rawBody = await getRawNewsSentiment(symbol);
  const normalized = normalizeNewsArticles(rawBody, symbol);

  const target = articleId.trim();
  return normalized.articles.find((article) => article.id === target) || null;
};

module.exports = {
  makeArticleId,
  normalizeNewsArticles,
  getNewsArticles,
  findArticleById,
};