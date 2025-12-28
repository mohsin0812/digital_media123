const express = require('express');
const { getDatabase } = require('../database/db');

const router = express.Router();

// Search photos by title, caption, location, or people
router.get('/', (req, res) => {
  const { q, location, creator, page, limit } = req.query;
  const searchQuery = q ? q.trim() : '';
  const searchLocation = location ? location.trim() : '';
  const searchCreator = creator ? creator.trim() : '';
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const db = getDatabase();

  let query = `
    SELECT p.*, u.username as creator_username,
     (SELECT AVG(rating) FROM ratings WHERE photo_id = p.id) as avg_rating,
     (SELECT COUNT(*) FROM ratings WHERE photo_id = p.id) as rating_count,
     (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
     FROM photos p
     JOIN users u ON p.creator_id = u.id
     WHERE 1=1
  `;
  const params = [];

  if (searchQuery) {
    query += ` AND (p.title LIKE ? OR p.caption LIKE ? OR p.people LIKE ?)`;
    const searchPattern = `%${searchQuery}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (searchLocation) {
    query += ` AND p.location LIKE ?`;
    params.push(`%${searchLocation}%`);
  }

  if (searchCreator) {
    query += ` AND u.username LIKE ?`;
    params.push(`%${searchCreator}%`);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limitNum, offset);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM photos p
    JOIN users u ON p.creator_id = u.id
    WHERE 1=1
  `;
  const countParams = [];

  if (searchQuery) {
    countQuery += ` AND (p.title LIKE ? OR p.caption LIKE ? OR p.people LIKE ?)`;
    const searchPattern = `%${searchQuery}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (searchLocation) {
    countQuery += ` AND p.location LIKE ?`;
    countParams.push(`%${searchLocation}%`);
  }

  if (searchCreator) {
    countQuery += ` AND u.username LIKE ?`;
    countParams.push(`%${searchCreator}%`);
  }

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('Search count error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const total = countResult.total;

    db.all(query, params, (err, photos) => {
      if (err) {
        console.error('Search error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        photos: photos || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        query: {
          q: searchQuery,
          location: searchLocation,
          creator: searchCreator
        }
      });
    });
  });
});

module.exports = router;

