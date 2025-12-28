const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check if user is a creator
function requireCreator(req, res, next) {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ error: 'Creator access required' });
  }
  next();
}

// Middleware to check if user is a consumer
function requireConsumer(req, res, next) {
  if (req.user.role !== 'consumer') {
    return res.status(403).json({ error: 'Consumer access required' });
  }
  next();
}

// Middleware to check if user is creator or consumer
function requireAnyRole(req, res, next) {
  if (req.user.role !== 'creator' && req.user.role !== 'consumer') {
    return res.status(403).json({ error: 'Valid user role required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireCreator,
  requireConsumer,
  requireAnyRole,
  JWT_SECRET
};

