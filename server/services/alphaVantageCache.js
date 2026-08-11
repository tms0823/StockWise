/**
 * Shared in-memory Alpha Vantage provider cache with single-flight request
 * deduplication and a global request scheduler/pacer.
 *
 * - Per-function-per-symbol entries: { data, fetchedAt }
 * - Fresh TTL: STOCK_CACHE_TTL_MS (default 300000 ms)
 * - Stale fallback bound: STOCK_CACHE_TTL_MS * 2 — expired entries remain
 *   available for the stale-on-429 fallback only within this bounded age,
 *   then are evicted. Stale data is never served indefinitely.
 * - Single-flight: concurrent callers for the same key await the same
 *   in-flight Promise instead of issuing duplicate provider requests.
 * - Global pacer: only actual cache-miss fetches enter a shared global
 *   queue. At most one Alpha Vantage request runs at a time, with ~2s
 *   spacing between actual calls (STOCK_API_MIN_INTERVAL_MS, default 2000).
 *   Fresh cache hits return immediately WITHOUT entering the queue.
 * - No rate-limit retries: a rate-limit response immediately goes to the
 *   stale-cache fallback; if no usable cache exists, the 429 propagates.
 *
 * Cache metadata is internal only — it is never added to public API
 * response shapes.
 */

const cache = new Map(); // key -> { data, fetchedAt }
const inFlight = new Map(); // key -> Promise

const getTtlMs = () => Number(process.env.STOCK_CACHE_TTL_MS) || 300000;
const getStaleMaxAgeMs = () => getTtlMs() * 2;
const getMinIntervalMs = () => Number(process.env.STOCK_API_MIN_INTERVAL_MS) || 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isFresh = (entry, ttlMs) => entry && Date.now() - entry.fetchedAt < ttlMs;
const isWithinStaleBound = (entry, staleMaxAgeMs) =>
  entry && Date.now() - entry.fetchedAt < staleMaxAgeMs;

const getFreshEntry = (key, ttlMs) => {
  const entry = cache.get(key);
  if (entry && isFresh(entry, ttlMs)) {
    return entry;
  }
  return null;
};

const getStaleEntry = (key, staleMaxAgeMs) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (isWithinStaleBound(entry, staleMaxAgeMs)) {
    return entry;
  }
  // Too old — evict so stale data is never served indefinitely.
  cache.delete(key);
  return null;
};

const set = (key, data) => {
  cache.set(key, { data, fetchedAt: Date.now() });
};

// --- Global request scheduler / pacer ---
// A single global queue chain. Only actual provider cache-miss fetches are
// scheduled through it; fresh cache hits never touch it. This guarantees
// that different provider keys never fire Alpha Vantage requests
// simultaneously, across stockService and marketService alike.
let queueTail = Promise.resolve();
let lastCallStartAt = 0;

const scheduleProviderCall = (fn) => {
  const run = async () => {
    // Wait until every previously scheduled call has completed.
    await queueTail;

    // Preserve ~2s spacing from the start of the last actual provider call.
    const waitMs = lastCallStartAt
      ? Math.max(0, lastCallStartAt + getMinIntervalMs() - Date.now())
      : 0;
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastCallStartAt = Date.now();
    return fn();
  };

  const task = run();

  // Chain the tail so the next scheduled call waits for this one.
  // Swallow errors so one failed fetch never blocks the queue.
  queueTail = task.then(
    () => undefined,
    () => undefined
  );

  return task;
};

/**
 * Resolve the effective TTL for a call.
 * - If options.ttlMs is supplied, it must be a positive finite number;
 *   malformed/zero values throw rather than silently falling back.
 * - Otherwise the existing global STOCK_CACHE_TTL_MS default is used.
 * @param {{ ttlMs?: number }} [options]
 * @returns {number} effective TTL in ms
 */
const resolveTtlMs = (options) => {
  if (options && options.ttlMs !== undefined) {
    const ttl = options.ttlMs;
    if (typeof ttl !== 'number' || !Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('fetchWithCache ttlMs must be a positive finite number');
    }
    return ttl;
  }
  return getTtlMs();
};

/**
 * Fetch a provider resource with:
 * 1. fresh-cache hit  -> return cached data immediately (no queue, no call)
 * 2. in-flight dedup  -> await the existing single-flight Promise
 * 3. otherwise        -> schedule exactly ONE provider call through the
 *                        global pacer; cache on success; on rate-limit,
 *                        serve stale data within the bounded age, else
 *                        propagate the 429. No retries.
 *
 * Optional per-call TTL override (backward compatible):
 *   fetchWithCache(key, fetcher)                    -> default TTL
 *   fetchWithCache(key, fetcher, { ttlMs })         -> custom TTL
 * The stale bound is always 2 * effective TTL.
 */
const fetchWithCache = async (key, fetcher, options) => {
  const ttlMs = resolveTtlMs(options);
  const staleMaxAgeMs = ttlMs * 2;

  const freshEntry = getFreshEntry(key, ttlMs);
  if (freshEntry) {
    return freshEntry.data;
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const data = await scheduleProviderCall(fetcher);
      set(key, data);
      return data;
    } catch (error) {
      if (error && error.code === 'STOCK_PROVIDER_RATE_LIMIT') {
        const staleEntry = getStaleEntry(key, staleMaxAgeMs);
        if (staleEntry) {
          return staleEntry.data;
        }
      }
      throw error;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
};

module.exports = { fetchWithCache };