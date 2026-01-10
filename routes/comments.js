const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Get comments for a photo
router.get('/photo/:photoId', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT c.*, u.username, u.role
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.photo_id = ?
     ORDER BY c.created_at DESC`,
    [req.params.photoId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ comments: comments || [] });
    }
  );
});

// Add comment (Authenticated users only)
router.post('/', authenticateToken, requireAnyRole, (req, res) => {
  try {
    const { photo_id, content } = req.body;

    if (!photo_id || !content) {
      return res.status(400).json({ error: 'Photo ID and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
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

      const commentId = uuidv4();

      db.run(
        'INSERT INTO comments (id, photo_id, user_id, content) VALUES (?, ?, ?, ?)',
        [commentId, photo_id, req.user.id, content.trim()],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to add comment' });
          }

          // Return the created comment with user info
          db.get(
            `SELECT c.*, u.username, u.role
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [commentId],
            (err, comment) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to retrieve comment' });
              }

              res.status(201).json({
                message: 'Comment added successfully',
                comment
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment (own comments only)
router.put('/:id', authenticateToken, requireAnyRole, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const db = getDatabase();

    // Check if comment exists and belongs to user
    db.get(
      'SELECT * FROM comments WHERE id = ?',
      [req.params.id],
      (err, comment) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!comment) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== req.user.id) {
          return res.status(403).json({ error: 'You can only edit your own comments' });
        }

        db.run(
          'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [content.trim(), req.params.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to update comment' });
            }

            res.json({ message: 'Comment updated successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment (own comments only)
router.delete('/:id', authenticateToken, requireAnyRole, (req, res) => {
  const db = getDatabase();

  // Check if comment exists and belongs to user
  db.get(
    'SELECT * FROM comments WHERE id = ?',
    [req.params.id],
    (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own comments' });
      }

      db.run('DELETE FROM comments WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete comment' });
        }

        res.json({ message: 'Comment deleted successfully' });
      });
    }
  );
});

module.exports = router;

