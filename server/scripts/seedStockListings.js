/**
 * One-off script to populate the StockListing collection with sample data.
 * Run manually: node scripts/seedStockListings.js
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const StockListing = require('../models/StockListing');
const stockListingsSeed = require('../data/stockListingsSeed');

const run = async () => {
  await connectDB();

  let upserted = 0;
  for (const listing of stockListingsSeed) {
    await StockListing.findOneAndUpdate(
      { symbol: listing.symbol },
      listing,
      { upsert: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }

  console.log(`Seeded ${upserted} stock listings.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed stock listings:', error.message);
  process.exit(1);
});
