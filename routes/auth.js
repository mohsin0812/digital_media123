const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register a new user
// - Consumers can always register
// - Admin can register ONLY if no admin exists (first-time setup)
// - Creators can only be added via admin
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDatabase();

    // Handle admin registration - only allowed if no admin exists
    if (role === 'admin') {
      return new Promise((resolve) => {
        db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'], (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (result.count > 0) {
            return res.status(403).json({ 
              error: 'An admin already exists. Admin registration is only allowed for first-time setup.' 
            });
          }

          // No admin exists, allow registration
          const userId = uuidv4();
          bcrypt.hash(password, 10).then(passwordHash => {
            db.run(
              'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
              [userId, username, email, passwordHash, 'admin'],
              function(err) {
                if (err) {
                  if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({ error: 'Username or email already exists' });
                  }
                  return res.status(500).json({ error: 'Failed to register admin' });
                }

                const token = jwt.sign(
                  { id: userId, username, email, role: 'admin' },
                  JWT_SECRET,
                  { expiresIn: '7d' }
                );

                res.status(201).json({
                  message: 'Admin registered successfully',
                  token,
                  user: { id: userId, username, email, role: 'admin' }
                });
                resolve();
              }
            );
          });
        });
      });
    }

    // Restrict creator registration - only allow consumer registration publicly
    if (role === 'creator') {
      return res.status(403).json({ 
        error: 'Creator accounts cannot be registered publicly. Please contact an administrator.' 
      });
    }

    if (role !== 'consumer') {
      return res.status(400).json({ error: 'Invalid role. Allowed roles: admin (first-time only), consumer' });
    }

    // Consumer registration
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, username, email, passwordHash, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Failed to register user' });
        }

        const token = jwt.sign(
          { id: userId, username, email, role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: userId, username, email, role }
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDatabase();

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();

  db.get(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

module.exports = router;

