const StockListing = require('../models/StockListing');
const Transaction = require('../models/Transaction');

const TRANSACTION_HISTORY_LIMIT = 50;

/**
 * Percentage change guarded against a zero or absent base.
 * A holding with no invested capital reports 0%, never NaN/Infinity.
 */
const toPercent = (amount, base) => (base > 0 ? (amount / base) * 100 : 0);

/**
 * Build the authenticated user's portfolio view.
 *
 * Current prices come from a SINGLE StockListing query ($in over every held
 * symbol) rather than one live-provider call per holding, which would exhaust
 * the Alpha Vantage quota on any realistic portfolio. A symbol missing from the
 * catalog falls back to its own averageBuyPrice, so it reports a flat position
 * instead of a fabricated gain or loss.
 */
const getPortfolio = async (user) => {
  const ownedHoldings = (user.holdings || []).filter((holding) => holding.quantity > 0);
  const symbols = ownedHoldings.map((holding) => holding.symbol);

  // Skip the round-trip entirely when the user holds nothing.
  const listings = symbols.length
    ? await StockListing.find({ symbol: { $in: symbols } }).lean()
    : [];

  const listingBySymbol = new Map(listings.map((listing) => [listing.symbol, listing]));

  let totalInvested = 0;
  let currentValue = 0;

  const holdings = ownedHoldings.map((holding) => {
    const { symbol, quantity, averageBuyPrice } = holding;
    const listing = listingBySymbol.get(symbol);
    const currentPrice = listing ? listing.price : averageBuyPrice;

    const invested = quantity * averageBuyPrice;
    const holdingValue = quantity * currentPrice;
    const profitLoss = holdingValue - invested;

    totalInvested += invested;
    currentValue += holdingValue;

    return {
      symbol,
      companyName: listing ? listing.companyName : null,
      quantity,
      averageBuyPrice,
      currentPrice,
      invested,
      currentValue: holdingValue,
      profitLoss,
      profitLossPercent: toPercent(profitLoss, invested),
    };
  });

  const totalProfitLoss = currentValue - totalInvested;

  return {
    virtualBalance: user.virtualBalance,
    holdings,
    summary: {
      totalInvested,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercent: toPercent(totalProfitLoss, totalInvested),
      totalAccountValue: user.virtualBalance + currentValue,
    },
  };
};

/**
 * Most recent trades for a user, newest first.
 * Served by the { user: 1, createdAt: -1 } index on Transaction.
 */
const getTransactions = async (userId) => {
  return Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(TRANSACTION_HISTORY_LIMIT)
    .lean();
};

module.exports = {
  getPortfolio,
  getTransactions,
};
