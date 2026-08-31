const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .delete(deleteUser)
  .put(updateUserRole);

router.route('/metrics')
  .get(getSystemMetrics);

router.route('/quizzes')
  .get(getQuizQuestions)
  .post(createQuizQuestion);

router.route('/quizzes/:id')
  .delete(deleteQuizQuestion);

router.route('/settings')
  .get(getSystemSettings)
  .post(updateSystemSettings);

router.route('/reports')
  .get(getSystemReports);

module.exports = router;
