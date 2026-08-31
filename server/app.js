const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const marketRoutes = require('./routes/marketRoutes');
const stockListingRoutes = require('./routes/stockListingRoutes');
const dummyInvestmentRoutes = require('./routes/dummyInvestmentRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const newsRoutes = require('./routes/newsRoutes');
const cueCardRoutes = require('./routes/cueCardRoutes');
const learningRoutes = require('./routes/learningRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/companies', stockListingRoutes);
app.use('/api/dummy-investment', dummyInvestmentRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/cue-cards', cueCardRoutes);
app.use('/api/learning', learningRoutes);

// 404 handler for unknown API routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;