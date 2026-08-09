const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;

router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  });
router.get('/:symbol/chart', async (req, res) => {
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`StockWise API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();