const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check for Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT — only token failures (invalid/malformed/expired) return 401 here
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }

    // Load user — password remains excluded automatically (select: false on model)
    const user = await User.findById(decoded.id);

    // Valid token but user no longer exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Unexpected database/server error — pass to centralized error handler
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Missing req.user — protect did not authenticate the request
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Role must come ONLY from the authenticated user loaded by protect from MongoDB
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
