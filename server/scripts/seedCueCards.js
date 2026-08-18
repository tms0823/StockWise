/**
 * One-off script to populate the CueCard collection with sample learning
 * content. Run manually: node scripts/seedCueCards.js
 *
 * Idempotent: uses upsert on the unique `topic` field, so running it again
 * will not create duplicate records.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CueCard = require('../models/CueCard');
const cueCardsSeed = require('../data/cueCardsSeed');

const run = async () => {
  await connectDB();

  let upserted = 0;
  for (const card of cueCardsSeed) {
    await CueCard.findOneAndUpdate(
      { topic: card.topic },
      card,
      { upsert: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }

  console.log(`Seeded ${upserted} cue cards.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed cue cards:', error.message);
  process.exit(1);
});