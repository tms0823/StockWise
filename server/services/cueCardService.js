const CueCard = require('../models/CueCard');

const DEFAULT_PREVIEW_LIMIT = 4;

const getAllCueCards = async () =>
  CueCard.find().sort({ displayOrder: 1 }).lean();

const getCueCardPreview = async () =>
  CueCard.find()
    .sort({ displayOrder: 1 })
    .limit(DEFAULT_PREVIEW_LIMIT)
    .lean();

module.exports = {
  getAllCueCards,
  getCueCardPreview,
};