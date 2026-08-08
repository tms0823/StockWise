/**
 * Sample catalog of companies for the search/filter feature.
 * Prices and classifications (marketType, reputationStatus, riskLevel) are
 * curated snapshot values, not live data — see StockListing model.
 */
const stockListingsSeed = [
  // Technology
  { symbol: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', price: 313.33, dailyChange: 0.92, dailyChangePercent: 0.29, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'MSFT', companyName: 'Microsoft Corporation', sector: 'Technology', price: 468.12, dailyChange: 2.14, dailyChangePercent: 0.46, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'GOOGL', companyName: 'Alphabet Inc.', sector: 'Technology', price: 198.55, dailyChange: -1.05, dailyChangePercent: -0.53, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'NVDA', companyName: 'NVIDIA Corporation', sector: 'Technology', price: 179.88, dailyChange: 3.42, dailyChangePercent: 1.94, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'ORCL', companyName: 'Oracle Corporation', sector: 'Technology', price: 221.30, dailyChange: 1.10, dailyChangePercent: 0.50, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Low' },
  { symbol: 'ADBE', companyName: 'Adobe Inc.', sector: 'Technology', price: 412.77, dailyChange: -3.20, dailyChangePercent: -0.77, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
  { symbol: 'CRM', companyName: 'Salesforce, Inc.', sector: 'Technology', price: 264.40, dailyChange: 0.85, dailyChangePercent: 0.32, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
  { symbol: 'AMD', companyName: 'Advanced Micro Devices, Inc.', sector: 'Technology', price: 158.65, dailyChange: 4.05, dailyChangePercent: 2.62, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },

  // Healthcare
  { symbol: 'JNJ', companyName: 'Johnson & Johnson', sector: 'Healthcare', price: 162.48, dailyChange: 0.44, dailyChangePercent: 0.27, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'PFE', companyName: 'Pfizer Inc.', sector: 'Healthcare', price: 25.67, dailyChange: -0.12, dailyChangePercent: -0.47, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'UNH', companyName: 'UnitedHealth Group Incorporated', sector: 'Healthcare', price: 342.19, dailyChange: 5.30, dailyChangePercent: 1.57, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'ABBV', companyName: 'AbbVie Inc.', sector: 'Healthcare', price: 198.02, dailyChange: 1.02, dailyChangePercent: 0.52, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Low' },
  { symbol: 'MRNA', companyName: 'Moderna, Inc.', sector: 'Healthcare', price: 31.44, dailyChange: -1.15, dailyChangePercent: -3.53, marketType: 'Mid-cap', reputationStatus: 'Emerging', riskLevel: 'High' },
  { symbol: 'CLOV', companyName: 'Clover Health Investments, Corp.', sector: 'Healthcare', price: 2.48, dailyChange: 0.06, dailyChangePercent: 2.48, marketType: 'Small-cap', reputationStatus: 'Penny Stock', riskLevel: 'High' },

  // Financial Services
  { symbol: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Financial Services', price: 289.75, dailyChange: 1.85, dailyChangePercent: 0.64, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'BAC', companyName: 'Bank of America Corporation', sector: 'Financial Services', price: 47.32, dailyChange: 0.28, dailyChangePercent: 0.60, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'GS', companyName: 'The Goldman Sachs Group, Inc.', sector: 'Financial Services', price: 712.90, dailyChange: -4.60, dailyChangePercent: -0.64, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'V', companyName: 'Visa Inc.', sector: 'Financial Services', price: 342.11, dailyChange: 1.40, dailyChangePercent: 0.41, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'MA', companyName: 'Mastercard Incorporated', sector: 'Financial Services', price: 545.28, dailyChange: 2.05, dailyChangePercent: 0.38, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'SOFI', companyName: 'SoFi Technologies, Inc.', sector: 'Financial Services', price: 12.84, dailyChange: 0.34, dailyChangePercent: 2.72, marketType: 'Mid-cap', reputationStatus: 'Emerging', riskLevel: 'Medium' },

  // Energy
  { symbol: 'XOM', companyName: 'Exxon Mobil Corporation', sector: 'Energy', price: 118.60, dailyChange: 0.75, dailyChangePercent: 0.64, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'CVX', companyName: 'Chevron Corporation', sector: 'Energy', price: 164.22, dailyChange: -0.90, dailyChangePercent: -0.55, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'COP', companyName: 'ConocoPhillips', sector: 'Energy', price: 96.47, dailyChange: 0.55, dailyChangePercent: 0.57, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
  { symbol: 'PLUG', companyName: 'Plug Power Inc.', sector: 'Energy', price: 2.91, dailyChange: -0.08, dailyChangePercent: -2.68, marketType: 'Small-cap', reputationStatus: 'Penny Stock', riskLevel: 'High' },

  // Consumer Discretionary
  { symbol: 'AMZN', companyName: 'Amazon.com, Inc.', sector: 'Consumer Discretionary', price: 231.84, dailyChange: 2.90, dailyChangePercent: 1.27, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'TSLA', companyName: 'Tesla, Inc.', sector: 'Consumer Discretionary', price: 328.49, dailyChange: -6.75, dailyChangePercent: -2.01, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'High' },
  { symbol: 'HD', companyName: 'The Home Depot, Inc.', sector: 'Consumer Discretionary', price: 402.15, dailyChange: 1.60, dailyChangePercent: 0.40, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'NKE', companyName: 'NIKE, Inc.', sector: 'Consumer Discretionary', price: 78.33, dailyChange: -0.42, dailyChangePercent: -0.53, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'MCD', companyName: "McDonald's Corporation", sector: 'Consumer Discretionary', price: 305.77, dailyChange: 0.98, dailyChangePercent: 0.32, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'RIVN', companyName: 'Rivian Automotive, Inc.', sector: 'Consumer Discretionary', price: 13.92, dailyChange: 0.61, dailyChangePercent: 4.58, marketType: 'Mid-cap', reputationStatus: 'Emerging', riskLevel: 'High' },
  { symbol: 'NIO', companyName: 'NIO Inc.', sector: 'Consumer Discretionary', price: 4.87, dailyChange: -0.21, dailyChangePercent: -4.13, marketType: 'Small-cap', reputationStatus: 'Emerging', riskLevel: 'High' },
  { symbol: 'GPRO', companyName: 'GoPro, Inc.', sector: 'Consumer Discretionary', price: 0.87, dailyChange: -0.03, dailyChangePercent: -3.33, marketType: 'Small-cap', reputationStatus: 'Penny Stock', riskLevel: 'High' },

  // Consumer Staples
  { symbol: 'KO', companyName: 'The Coca-Cola Company', sector: 'Consumer Staples', price: 71.28, dailyChange: 0.18, dailyChangePercent: 0.25, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'PG', companyName: 'The Procter & Gamble Company', sector: 'Consumer Staples', price: 168.94, dailyChange: 0.55, dailyChangePercent: 0.33, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'WMT', companyName: 'Walmart Inc.', sector: 'Consumer Staples', price: 102.36, dailyChange: 1.05, dailyChangePercent: 1.04, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'PEP', companyName: 'PepsiCo, Inc.', sector: 'Consumer Staples', price: 148.60, dailyChange: -0.30, dailyChangePercent: -0.20, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },

  // Industrials
  { symbol: 'BA', companyName: 'The Boeing Company', sector: 'Industrials', price: 178.42, dailyChange: -2.15, dailyChangePercent: -1.19, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'High' },
  { symbol: 'CAT', companyName: 'Caterpillar Inc.', sector: 'Industrials', price: 412.88, dailyChange: 3.30, dailyChangePercent: 0.81, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'GE', companyName: 'GE Aerospace', sector: 'Industrials', price: 231.55, dailyChange: 1.75, dailyChangePercent: 0.76, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },

  // Utilities
  { symbol: 'NEE', companyName: 'NextEra Energy, Inc.', sector: 'Utilities', price: 74.19, dailyChange: 0.22, dailyChangePercent: 0.30, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'DUK', companyName: 'Duke Energy Corporation', sector: 'Utilities', price: 121.03, dailyChange: -0.15, dailyChangePercent: -0.12, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },

  // Real Estate
  { symbol: 'PLD', companyName: 'Prologis, Inc.', sector: 'Real Estate', price: 108.77, dailyChange: 0.60, dailyChangePercent: 0.56, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
  { symbol: 'AMT', companyName: 'American Tower Corporation', sector: 'Real Estate', price: 189.34, dailyChange: -1.10, dailyChangePercent: -0.58, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },

  // Materials
  { symbol: 'LIN', companyName: 'Linde plc', sector: 'Materials', price: 462.51, dailyChange: 2.40, dailyChangePercent: 0.52, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'SHW', companyName: 'The Sherwin-Williams Company', sector: 'Materials', price: 358.90, dailyChange: 1.15, dailyChangePercent: 0.32, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Low' },

  // Communication Services
  { symbol: 'META', companyName: 'Meta Platforms, Inc.', sector: 'Communication Services', price: 612.47, dailyChange: -3.80, dailyChangePercent: -0.62, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'DIS', companyName: 'The Walt Disney Company', sector: 'Communication Services', price: 109.28, dailyChange: 0.71, dailyChangePercent: 0.65, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Medium' },
  { symbol: 'NFLX', companyName: 'Netflix, Inc.', sector: 'Communication Services', price: 924.60, dailyChange: 8.15, dailyChangePercent: 0.89, marketType: 'Large-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
  { symbol: 'T', companyName: 'AT&T Inc.', sector: 'Communication Services', price: 24.66, dailyChange: 0.09, dailyChangePercent: 0.37, marketType: 'Large-cap', reputationStatus: 'Blue-chip', riskLevel: 'Low' },
  { symbol: 'SIRI', companyName: 'Sirius XM Holdings Inc.', sector: 'Communication Services', price: 4.12, dailyChange: -0.05, dailyChangePercent: -1.20, marketType: 'Small-cap', reputationStatus: 'Established', riskLevel: 'Medium' },
];

module.exports = stockListingsSeed;
