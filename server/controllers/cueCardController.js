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

module.exports = {
  getCueCards,
  getCueCardPreview: getCueCardPreviewHandler,
};