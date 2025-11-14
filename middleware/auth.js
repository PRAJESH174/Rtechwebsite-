const jwt = require('jsonwebtoken');
const config = require('../config/production.config');

// Verify JWT Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Verify Admin Role Middleware
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Check if user owns the resource
const checkOwnership = (resourceUserId, currentUserId, currentUserRole) => {
  return resourceUserId === currentUserId || currentUserRole === 'admin';
};

module.exports = {
  verifyToken,
  verifyAdmin,
  checkOwnership
};
