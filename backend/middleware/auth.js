const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes – require valid JWT
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, error: 'Not authorised – no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, error: 'User no longer exists' });
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token invalid or expired' });
  }
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// Optional auth (attaches user if token present, doesn't fail if missing)
exports.optionalAuth = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {}
  }
  next();
};
