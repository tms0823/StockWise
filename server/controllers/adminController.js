const User = require('../models/User');
const CueCard = require('../models/CueCard');
const QuizQuestion = require('../models/QuizQuestion');
const SystemSetting = require('../models/SystemSetting');
const Transaction = require('../models/Transaction');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system metrics (users, cuecards, quizzes)
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getSystemMetrics = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const cueCardCount = await CueCard.countDocuments();
    const quizCount = await QuizQuestion.countDocuments();

    res.json({
      success: true,
      data: {
        users: userCount,
        cueCards: cueCardCount,
        quizQuestions: quizCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quiz questions
// @route   GET /api/admin/quizzes
// @access  Private/Admin
const getQuizQuestions = async (req, res, next) => {
  try {
    const questions = await QuizQuestion.find({});
    res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a quiz question
// @route   POST /api/admin/quizzes
// @access  Private/Admin
const createQuizQuestion = async (req, res, next) => {
  try {
    const question = await QuizQuestion.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a quiz question
// @route   DELETE /api/admin/quizzes/:id
// @access  Private/Admin
const deleteQuizQuestion = async (req, res, next) => {
  try {
    const question = await QuizQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Quiz question not found' });
    }
    res.json({ success: true, message: 'Quiz question removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all system settings or a specific setting
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find({});
    // Convert array to a key-value object for easier frontend consumption
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Provide default reputation weights if not set in DB yet
    if (!settingsObj.reputationWeights) {
      settingsObj.reputationWeights = {
        financialPerformance: 20,
        priceStability: 15,
        dividendRecord: 15,
        debtLevel: 15,
        profitGrowth: 15,
        marketReputation: 10,
        newsSentiment: 10,
      };
    }

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings (such as reputation weights)
// @route   POST /api/admin/settings
// @access  Private/Admin
const updateSystemSettings = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required' });
    }

    // Validation for reputationWeights if key is 'reputationWeights'
    if (key === 'reputationWeights') {
      const weights = value;
      const total = Object.values(weights).reduce((sum, w) => sum + Number(w), 0);
      if (total !== 100) {
        return res.status(400).json({ success: false, message: `Weights must total 100. Current total is ${total}` });
      }
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system activity reports (transactions, balances)
// @route   GET /api/admin/reports
// @access  Private/Admin
const getSystemReports = async (req, res, next) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    
    // Recent transactions
    const recentTransactions = await Transaction.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(15);

    // Sum of all volume
    const volumeResult = await Transaction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$total' } } }
    ]);
    const totalVolume = volumeResult[0]?.totalVolume || 0;

    // Leaderboard by virtual balance
    const userLeaderboard = await User.find({})
      .select('name email role virtualBalance createdAt')
      .sort({ virtualBalance: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalTransactions,
        totalVolume,
        recentTransactions,
        userLeaderboard
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  deleteUser,
  updateUserRole,
  getSystemMetrics,
  getQuizQuestions,
  createQuizQuestion,
  deleteQuizQuestion,
  getSystemSettings,
  updateSystemSettings,
  getSystemReports
};
