const mongoose = require('mongoose');

const getHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const databaseStatus = dbState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'StockWise API is running',
    database: databaseStatus,
  });
};

module.exports = { getHealth };