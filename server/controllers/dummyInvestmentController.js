// DummyInvestmentController: backend for Module 2 Member 3 —
// Dummy Stock Investment Tab + Dummy Buy/Sell System.
//
// Uses the authenticated user attached by the `protect` middleware (req.user)
// and the existing cache-aware getQuote() from stockService for the
// authoritative server-side current price. Client-supplied prices are never
// trusted. This is virtual/dummy trading only — no real money.
//
// Member 4 handoff boundary: only user.virtualBalance and user.holdings
// ({ symbol, quantity, averageBuyPrice }) are persisted here. Transaction
// history, P&L, and portfolio analytics belong to Member 4 and are NOT built.

const { getQuote } = require('../services/stockService');
const Transaction = require('../models/Transaction');

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Validate and normalize a symbol from the request body.
 * Returns the normalized uppercase symbol or null if invalid.
 */
const normalizeSymbol = (symbol) => {
  if (typeof symbol !== 'string' || !symbol.trim()) return null;
  return symbol.trim().toUpperCase();
};

/**
 * Validate a quantity from the request body.
 * Must be a finite positive integer (reject zero, negatives, decimals).
 * Returns the integer quantity or null if invalid.
 */
const validateQuantity = (quantity) => {
  if (!isFiniteNumber(quantity)) return null;
  if (!Number.isInteger(quantity)) return null;
  if (quantity <= 0) return null;
  return quantity;
};

/**
 * GET /api/dummy-investment
 * Return the authenticated user's virtual balance and holdings.
 */
const getDummyInvestment = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        virtualBalance: user.virtualBalance,
        holdings: user.holdings || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/dummy-investment/buy
 * Body: { symbol, quantity }
 * Uses the server-authoritative live price from getQuote().
 */
const buyStock = async (req, res, next) => {
  try {
    const user = req.user;
    const { symbol, quantity } = req.body;

    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) {
      return res.status(400).json({
        success: false,
        message: 'A valid stock symbol is required',
      });
    }

    const qty = validateQuantity(quantity);
    if (qty === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    // Authoritative server-side price — never trust a client-supplied price.
    let quote;
    try {
      quote = await getQuote(normalizedSymbol);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to fetch a live price for this stock',
      });
    }

    const currentPrice = quote && quote.currentPrice;
    if (!isFiniteNumber(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Live price is currently unavailable for this stock',
      });
    }

    const totalCost = currentPrice * qty;

    if (user.virtualBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient virtual balance for this purchase',
      });
    }

    const holdings = user.holdings || [];
    const existing = holdings.find((h) => h.symbol === normalizedSymbol);

    if (existing) {
      const oldQuantity = existing.quantity;
      const oldAverageBuyPrice = existing.averageBuyPrice;
      const newQuantity = oldQuantity + qty;
      existing.quantity = newQuantity;
      existing.averageBuyPrice =
        (oldQuantity * oldAverageBuyPrice + qty * currentPrice) / newQuantity;
    } else {
      holdings.push({
        symbol: normalizedSymbol,
        quantity: qty,
        averageBuyPrice: currentPrice,
      });
    }

    user.virtualBalance -= totalCost;
    user.holdings = holdings;

    await user.save();

    // Ledger entry is written only after the balance/holdings change is durable,
    // so a failed save never leaves a phantom trade in history. A BUY realizes
    // nothing, so profitLoss stays 0.
    await Transaction.create({
      user: user._id,
      symbol: normalizedSymbol,
      type: 'BUY',
      quantity: qty,
      price: currentPrice,
      total: totalCost,
      profitLoss: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Dummy stock purchased successfully',
      data: {
        symbol: normalizedSymbol,
        quantity: qty,
        executedPrice: currentPrice,
        totalCost,
        virtualBalance: user.virtualBalance,
        holdings: user.holdings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/dummy-investment/sell
 * Body: { symbol, quantity }
 * Uses the server-authoritative live price from getQuote().
 */
const sellStock = async (req, res, next) => {
  try {
    const user = req.user;
    const { symbol, quantity } = req.body;

    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) {
      return res.status(400).json({
        success: false,
        message: 'A valid stock symbol is required',
      });
    }

    const qty = validateQuantity(quantity);
    if (qty === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const holdings = user.holdings || [];
    const existing = holdings.find((h) => h.symbol === normalizedSymbol);

    if (!existing) {
      return res.status(400).json({
        success: false,
        message: 'You do not own this stock',
      });
    }

    if (qty > existing.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient owned quantity for this sale',
      });
    }

    // Authoritative server-side price — never trust a client-supplied price.
    let quote;
    try {
      quote = await getQuote(normalizedSymbol);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to fetch a live price for this stock',
      });
    }

    const currentPrice = quote && quote.currentPrice;
    if (!isFiniteNumber(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Live price is currently unavailable for this stock',
      });
    }

    const proceeds = currentPrice * qty;

    // Captured before the holding is mutated or removed below — a full sell
    // drops the entry, taking averageBuyPrice with it.
    const buyPriceAtSale = existing.averageBuyPrice;

    if (qty === existing.quantity) {
      // Selling all shares — remove the holding.
      user.holdings = holdings.filter((h) => h.symbol !== normalizedSymbol);
    } else {
      // Partial sell — keep averageBuyPrice unchanged.
      existing.quantity -= qty;
    }

    user.virtualBalance += proceeds;

    await user.save();

    // Ledger entry is written only after the balance/holdings change is durable.
    await Transaction.create({
      user: user._id,
      symbol: normalizedSymbol,
      type: 'SELL',
      quantity: qty,
      price: currentPrice,
      total: proceeds,
      profitLoss: (currentPrice - buyPriceAtSale) * qty,
    });

    res.status(200).json({
      success: true,
      message: 'Dummy stock sold successfully',
      data: {
        symbol: normalizedSymbol,
        quantity: qty,
        executedPrice: currentPrice,
        proceeds,
        virtualBalance: user.virtualBalance,
        holdings: user.holdings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDummyInvestment,
  buyStock,
  sellStock,
};