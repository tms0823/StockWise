const mongoose = require('mongoose');

const autoSeed = async () => {
  try {
    // Seed Cue Cards
    const CueCard = require('../models/CueCard');
    const cueCardsSeed = require('../data/cueCardsSeed');
    for (const card of cueCardsSeed) {
      await CueCard.findOneAndUpdate(
        { topic: card.topic },
        card,
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    // Seed Quiz Questions
    const QuizQuestion = require('../models/QuizQuestion');
    const quizQuestionsSeed = require('../data/quizQuestionsSeed');
    for (const q of quizQuestionsSeed) {
      await QuizQuestion.findOneAndUpdate(
        { topic: q.topic, question: q.question },
        q,
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ Auto-seeding warning:', err.message);
  }
};

const autoPromoteAdmin = async () => {
  try {
    const User = require('../models/User');
    const adminEmail = 'rid123@gmail.com';
    let user = await User.findOne({ email: adminEmail });

    if (!user) {
      user = await User.create({
        name: 'Admin User',
        email: adminEmail,
        phone: '1234567890',
        password: 'password123',
        role: 'admin',
      });
      console.log(`👑 Auto-created default admin user ${adminEmail} (password: "password123").`);
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`👑 Auto-promoted ${adminEmail} to admin.`);
    }
  } catch (err) {
    console.warn('⚠️ Auto-promote admin warning:', err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
    await autoSeed();
    await autoPromoteAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;