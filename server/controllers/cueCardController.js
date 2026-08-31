const CueCard = require('../models/CueCard');
const { getAllCueCards, getCueCardPreview } = require('../services/cueCardService');

const getCueCards = async (req, res, next) => {
  try {
    const cards = await getAllCueCards();

    res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    next(error);
  }
};

const getCueCardPreviewHandler = async (req, res, next) => {
  try {
    const cards = await getCueCardPreview();

    res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    next(error);
  }
};

const createCueCard = async (req, res, next) => {
  try {
    const card = await CueCard.create(req.body);
    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCueCard = async (req, res, next) => {
  try {
    const card = await CueCard.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Cue card not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Cue card removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCueCards,
  getCueCardPreview: getCueCardPreviewHandler,
  createCueCard,
  deleteCueCard,
};