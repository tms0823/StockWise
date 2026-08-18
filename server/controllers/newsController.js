// NewsController: HTTP handlers for the Module 3 Beginner Market News
// Explanation feature.
//
// - GET  /api/news/symbol/:symbol/articles  -> provider-backed article list
// - POST /api/news/explain                   -> AI explanation for ONE article
//
// BOTH handlers are protected by the existing `protect` JWT middleware
// (registered in newsRoutes.js). The explain handler is the sensitive one —
// it triggers a paid OpenAI call, so only authenticated registered users can
// invoke it.
//
// SECURITY: The explain handler receives ONLY { symbol, articleId } from the
// client. The article is ALWAYS resolved server-side from the cached Alpha
// Vantage NEWS_SENTIMENT response via newsService.findArticleById(). The
// frontend can never inject arbitrary article text into the AI.

const {
  getNewsArticles,
  findArticleById,
} = require('../services/newsService');
const { explainNewsArticle } = require('../services/aiExplanationService');

const normalizeSymbol = (symbol) => symbol.trim().toUpperCase();

// Defensive string/non-empty validation used for BOTH route params and body.
const isValidSymbol = (symbol) =>
  typeof symbol === 'string' && symbol.trim().length > 0;

const getNewsArticlesHandler = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock symbol is required',
      });
    }

    const data = await getNewsArticles(symbol);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const explainArticleHandler = async (req, res, next) => {
  try {
    const { symbol, articleId } = req.body || {};

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock symbol is required',
      });
    }

    if (typeof articleId !== 'string' || articleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid articleId is required',
      });
    }

    const normalizedSymbol = normalizeSymbol(symbol);

    // Resolve the article ONLY from the cached provider response. If the
    // articleId does not exist for this symbol, return a controlled 404.
    const article = await findArticleById(normalizedSymbol, articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found for the requested symbol',
      });
    }

    // Provider-backed article only — never client-supplied text.
    const explanation = await explainNewsArticle({
      symbol: normalizedSymbol,
      article,
    });

    res.status(200).json({
      success: true,
      data: {
        symbol: normalizedSymbol,
        article: {
          title: article.title,
        },
        explanation,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNewsArticles: getNewsArticlesHandler,
  explainArticle: explainArticleHandler,
};