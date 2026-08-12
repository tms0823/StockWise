/**
 * Beginner-friendly educational cue cards for learning basic stock market
 * concepts. These are curated, static learning materials — not financial
 * advice. Each record contains one concept with a simple explanation.
 *
 * Seeded idempotently via scripts/seedCueCards.js (upsert on unique topic).
 */
const cueCardsSeed = [
  {
    topic: 'Stock',
    definition:
      'A stock represents a small piece of ownership in a company. If you buy a company\u2019s stock, you become one of its shareholders.',
    example: 'If you own one share of a company, you own a tiny part of that business.',
    displayOrder: 1,
  },
  {
    topic: 'Dividend',
    definition:
      'A dividend is a payment a company makes to its shareholders from its profits. It is a way companies share some of their success with the people who own their stock.',
    example: 'If a company earns a profit, it may pay shareholders a small cash amount per share each quarter.',
    displayOrder: 2,
  },
  {
    topic: 'Risk',
    definition:
      'Risk is the chance that an investment may lose value or not perform as expected. In general, investments with higher potential returns also come with higher risk.',
    example: 'A brand-new small company can be riskier than a large, well-established one.',
    displayOrder: 3,
  },
  {
    topic: 'Diversification',
    definition:
      'Diversification means spreading your money across different investments so that a problem in one area does not hurt your whole portfolio.',
    example: 'Instead of buying only one stock, you spread your money across several companies and industries.',
    displayOrder: 4,
  },
  {
    topic: 'Portfolio',
    definition:
      'A portfolio is the collection of all the investments you own, such as stocks, bonds, or cash. It is the full set of assets you hold as an investor.',
    example: 'If you own shares in two companies and keep some cash, those together form your portfolio.',
    displayOrder: 5,
  },
  {
    topic: 'Market Capitalization',
    definition:
      'Market capitalization (market cap) is the total value of a company\u2019s shares. It is calculated by multiplying the share price by the number of shares outstanding.',
    example: 'A company with 1 million shares priced at $10 each has a market cap of $10 million.',
    displayOrder: 6,
  },
  {
    topic: 'Bull Market',
    definition:
      'A bull market is a period when stock prices are generally rising and investors feel confident about the market.',
    example: 'When stock prices go up steadily over many months, people may say the market is in a bull market.',
    displayOrder: 7,
  },
  {
    topic: 'Bear Market',
    definition:
      'A bear market is a period when stock prices are generally falling, often by a significant amount, and investor confidence is low.',
    example: 'When stock prices drop sharply over a long period, people may say the market is in a bear market.',
    displayOrder: 8,
  },
  {
    topic: 'Price-to-Earnings (P/E) Ratio',
    definition:
      'The P/E ratio compares a company\u2019s stock price to its earnings per share. It helps investors see how much they are paying for each dollar of the company\u2019s earnings.',
    example: 'If a stock costs $50 and earns $5 per share, its P/E ratio is 10.',
    displayOrder: 9,
  },
];

module.exports = cueCardsSeed;