/**
 * Beginner-friendly quiz questions, two per cue card topic. Each `topic`
 * string matches a CueCard.topic value exactly so quizzes can be looked up
 * by the same key the cue cards use -- keep them in sync with
 * data/cueCardsSeed.js. Curly apostrophes are written as \u2019 escapes,
 * matching the cue card seed, so the text does not depend on file encoding.
 *
 * Seeded via scripts/seedQuizQuestions.js.
 */
const quizQuestionsSeed = [
  // Stock
  {
    topic: 'Stock',
    question: 'What does owning a share of stock represent?',
    options: [
      'A loan you made to the company',
      'A small piece of ownership in the company',
      'A guarantee of future profit',
      'A savings account held at the company',
    ],
    correctOptionIndex: 1,
    explanation:
      'A stock is a small piece of ownership in a company. It is not a loan and it does not guarantee any profit.',
  },
  {
    topic: 'Stock',
    question: 'If you buy a company\u2019s stock, what do you become?',
    options: ['A customer', 'An employee', 'A shareholder', 'A lender'],
    correctOptionIndex: 2,
    explanation:
      'People who own a company\u2019s stock are called shareholders, because they hold shares of that business.',
  },

  // Dividend
  {
    topic: 'Dividend',
    question: 'Where does the money for a dividend come from?',
    options: [
      'The company\u2019s profits',
      'A loan taken out by the shareholder',
      'The stock exchange',
      'Other shareholders\u2019 accounts',
    ],
    correctOptionIndex: 0,
    explanation:
      'Dividends are paid out of a company\u2019s profits, which is how it shares some of its success with shareholders.',
  },
  {
    topic: 'Dividend',
    question: 'Who receives a company\u2019s dividend payments?',
    options: [
      'Only the company\u2019s employees',
      'The company\u2019s shareholders',
      'The company\u2019s suppliers',
      'Anyone who follows the company online',
    ],
    correctOptionIndex: 1,
    explanation:
      'Dividends go to shareholders -- the people who own the company\u2019s stock -- usually as a cash amount per share.',
  },

  // Risk
  {
    topic: 'Risk',
    question: 'In investing, what does risk describe?',
    options: [
      'The chance an investment loses value or underperforms',
      'The guaranteed return of an investment',
      'The fee a broker charges per trade',
      'The number of shares a company has issued',
    ],
    correctOptionIndex: 0,
    explanation:
      'Risk is the chance that an investment may lose value or not perform as expected.',
  },
  {
    topic: 'Risk',
    question:
      'In general, investments with higher potential returns also come with:',
    options: ['Lower risk', 'Higher risk', 'No risk at all', 'Guaranteed returns'],
    correctOptionIndex: 1,
    explanation:
      'Higher potential return usually means higher risk. A brand-new small company can be riskier than a large, well-established one.',
  },

  // Diversification
  {
    topic: 'Diversification',
    question: 'What is the main goal of diversification?',
    options: [
      'Putting all your money into the single best stock',
      'Spreading money across investments so one problem does not hurt everything',
      'Buying and selling as often as possible',
      'Avoiding the stock market entirely',
    ],
    correctOptionIndex: 1,
    explanation:
      'Diversification spreads your money across different investments so trouble in one area does not damage your whole portfolio.',
  },
  {
    topic: 'Diversification',
    question: 'Which of these portfolios is better diversified?',
    options: [
      'Shares in one company only',
      'Shares across several companies and industries',
      'One stock bought on two different days',
      'Cash held in a single account',
    ],
    correctOptionIndex: 1,
    explanation:
      'Holding several companies across different industries spreads risk far better than concentrating in one place.',
  },

  // Portfolio
  {
    topic: 'Portfolio',
    question: 'What is a portfolio?',
    options: [
      'The single stock you own the most of',
      'The collection of all the investments you own',
      'A report a company publishes each quarter',
      'The fee charged when you buy a stock',
    ],
    correctOptionIndex: 1,
    explanation:
      'A portfolio is the full set of assets you hold as an investor, not just one of them.',
  },
  {
    topic: 'Portfolio',
    question: 'Which of these can be part of a portfolio?',
    options: [
      'Only individual stocks',
      'Only cash',
      'Stocks, bonds, and cash',
      'Only bonds',
    ],
    correctOptionIndex: 2,
    explanation:
      'A portfolio can hold many kinds of assets together, such as stocks, bonds, or cash.',
  },

  // Market Capitalization
  {
    topic: 'Market Capitalization',
    question: 'How is market capitalization calculated?',
    options: [
      'Share price multiplied by the number of shares outstanding',
      'Share price divided by earnings per share',
      'Total profit minus total debt',
      'Number of shareholders multiplied by share price',
    ],
    correctOptionIndex: 0,
    explanation:
      'Market cap is share price times shares outstanding, which gives the total value of a company\u2019s shares.',
  },
  {
    topic: 'Market Capitalization',
    question:
      'A company has 1 million shares priced at $10 each. What is its market cap?',
    options: ['$100,000', '$1 million', '$10 million', '$100 million'],
    correctOptionIndex: 2,
    explanation: '1,000,000 shares at $10 per share = $10 million.',
  },

  // Bull Market
  {
    topic: 'Bull Market',
    question: 'Which best describes a bull market?',
    options: [
      'Prices are generally rising and investors feel confident',
      'Prices are generally falling and confidence is low',
      'Prices stay exactly flat for a year',
      'The market is closed to new investors',
    ],
    correctOptionIndex: 0,
    explanation:
      'A bull market is a stretch of generally rising prices paired with confident investors.',
  },
  {
    topic: 'Bull Market',
    question:
      'Stock prices have climbed steadily for many months. Investors would likely call this:',
    options: ['A bear market', 'A bull market', 'A dividend cut', 'A stock split'],
    correctOptionIndex: 1,
    explanation:
      'Steadily rising prices over many months is the classic description of a bull market.',
  },

  // Bear Market
  {
    topic: 'Bear Market',
    question: 'Which best describes a bear market?',
    options: [
      'Prices are generally falling, often sharply, and confidence is low',
      'Prices are generally rising and confidence is high',
      'A market with no trading at all',
      'A market where only dividends are paid',
    ],
    correctOptionIndex: 0,
    explanation:
      'A bear market is a period of generally falling prices, often by a significant amount, with low investor confidence.',
  },
  {
    topic: 'Bear Market',
    question:
      'Stock prices have dropped sharply over a long period. This is most often called:',
    options: ['A bull market', 'A bear market', 'Diversification', 'A dividend'],
    correctOptionIndex: 1,
    explanation:
      'A long stretch of sharply falling prices is what people mean by a bear market.',
  },

  // Price-to-Earnings (P/E) Ratio
  {
    topic: 'Price-to-Earnings (P/E) Ratio',
    question: 'What does the P/E ratio compare?',
    options: [
      'A stock\u2019s price to its earnings per share',
      'A company\u2019s debt to its assets',
      'A stock\u2019s price to its dividend',
      'Market cap to the number of employees',
    ],
    correctOptionIndex: 0,
    explanation:
      'The P/E ratio compares a company\u2019s stock price to its earnings per share, showing how much you pay for each dollar of earnings.',
  },
  {
    topic: 'Price-to-Earnings (P/E) Ratio',
    question: 'A stock costs $50 and earns $5 per share. What is its P/E ratio?',
    options: ['5', '10', '25', '50'],
    correctOptionIndex: 1,
    explanation: 'A $50 price divided by $5 earnings per share gives a P/E ratio of 10.',
  },
];

module.exports = quizQuestionsSeed;
