const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Get rating for a photo by current user
router.get('/photo/:photoId/user', authenticateToken, requireAnyRole, (req, res) => {
  const db = getDatabase();

  db.get(
    'SELECT * FROM ratings WHERE photo_id = ? AND user_id = ?',
    [req.params.photoId, req.user.id],
    (err, rating) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ rating: rating || null });
    }
  );
});

// Get all ratings for a photo
router.get('/photo/:photoId', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT r.*, u.username
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.photo_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.photoId],
    (err, ratings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate average rating
      db.get(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE photo_id = ?',
        [req.params.photoId],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            ratings: ratings || [],
            stats: {
              average: stats.avg_rating ? parseFloat(stats.avg_rating.toFixed(2)) : 0,
              count: stats.count || 0
            }
          });
        }
      );
    }
  );
});

// Add or update rating (Authenticated users only)
router.post('/', authenticateToken, requireAnyRole, (req, res) => {
  try {
    const { photo_id, rating } = req.body;

    if (!photo_id || !rating) {
      return res.status(400).json({ error: 'Photo ID and rating are required' });
    }

    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    const db = getDatabase();

    // Verify photo exists
    db.get('SELECT id FROM photos WHERE id = ?', [photo_id], (err, photo) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Check if rating already exists
      db.get(
        'SELECT * FROM ratings WHERE photo_id = ? AND user_id = ?',
        [photo_id, req.user.id],
        (err, existingRating) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingRating) {
            // Update existing rating
            db.run(
              'UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [ratingValue, existingRating.id],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to update rating' });
                }

                res.json({
                  message: 'Rating updated successfully',
                  rating: { ...existingRating, rating: ratingValue }
                });
              }
            );
          } else {
            // Create new rating
            const ratingId = uuidv4();

            db.run(
              'INSERT INTO ratings (id, photo_id, user_id, rating) VALUES (?, ?, ?, ?)',
              [ratingId, photo_id, req.user.id, ratingValue],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to add rating' });
                }

                res.status(201).json({
                  message: 'Rating added successfully',
                  rating: {
                    id: ratingId,
                    photo_id,
                    user_id: req.user.id,
                    rating: ratingValue
                  }
                });
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rating (own ratings only)
router.delete('/photo/:photoId', authenticateToken, requireAnyRole, (req, res) => {
  const db = getDatabase();

  db.run(
    'DELETE FROM ratings WHERE photo_id = ? AND user_id = ?',
    [req.params.photoId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Rating not found' });
      }

      res.json({ message: 'Rating deleted successfully' });
    }
  );
});

module.exports = router;

