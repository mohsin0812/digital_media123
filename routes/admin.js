const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');

const router = express.Router();

// Admin check function
function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

// Create a creator account (admin only)
router.post('/create-creator', authenticateToken, async (req, res) => {
  try {
    // Check for admin role
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const db = getDatabase();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, username, email, passwordHash, 'creator'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Failed to create creator account' });
        }

        // Clear cache
        clearCache('photos');
        clearCache('search');

        res.status(201).json({
          message: 'Creator account created successfully',
          user: { id: userId, username, email, role: 'creator' }
        });
      }
    );
  } catch (error) {
    console.error('Create creator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all users (admin only)
router.get('/users', authenticateToken, (req, res) => {
  // Check for admin role
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = getDatabase();

  db.all(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ users });
    }
  );
});

module.exports = router;

