const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/db');
const { authenticateToken, requireCreator } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');
const { processImage } = require('../utils/imageProcessor');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|ogg|mov/;
  const extname = path.extname(file.originalname).toLowerCase();
  
  // More lenient check - accept if extension OR mimetype matches
  const hasImageExt = allowedImageTypes.test(extname);
  const hasVideoExt = allowedVideoTypes.test(extname);
  const hasImageMime = file.mimetype.startsWith('image/');
  const hasVideoMime = file.mimetype.startsWith('video/');
  
  const isImage = hasImageExt || hasImageMime;
  const isVideo = hasVideoExt || hasVideoMime;

  console.log(`File filter check: ${file.originalname}, ext: ${extname}, mime: ${file.mimetype}, isImage: ${isImage}, isVideo: ${isVideo}`);

  if (isImage || isVideo) {
    return cb(null, true);
  } else {
    const errorMsg = `Only image (jpeg, jpg, png, gif, webp) or video (mp4, webm, ogg, mov) files are allowed. Got: ${file.mimetype}`;
    console.log(`File rejected: ${errorMsg}`);
    cb(new Error(errorMsg));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: fileFilter
});

// Upload media (photo or video) (Creator, Admin, or Consumer - all can upload)
router.post('/upload', authenticateToken, requireCreator, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum size is 100MB.' });
        }
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      // Handle file filter errors
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    // If no error, continue to the next handler
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }
    
    console.log('File uploaded:', req.file.originalname, 'Type:', req.file.mimetype, 'Size:', req.file.size);

    const { title, caption, location, people } = req.body;

    if (!title) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title is required' });
    }

    // Determine media type from MIME type
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'photo';

    // Process and optimize image (only for photos)
    let processedImages = null;
    let filePath;
    
    if (mediaType === 'photo') {
      try {
        processedImages = await processImage(req.file.path);
        filePath = `/uploads/${path.basename(processedImages.optimized || req.file.filename)}`;
      } catch (imgError) {
        console.error('Image processing error:', imgError);
        // Continue with original if processing fails
        processedImages = {
          original: req.file.path,
          optimized: req.file.path,
          thumbnail: req.file.path
        };
        filePath = `/uploads/${req.file.filename}`;
      }
    } else {
      // For videos, use the original file
      filePath = `/uploads/${req.file.filename}`;
    }

    const db = getDatabase();
    const photoId = uuidv4();

    // Function to perform the actual database insert
    const performInsert = () => {
      db.run(
        `INSERT INTO photos (id, creator_id, title, caption, location, people, file_path, file_name, mime_type, file_size, media_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          photoId,
          req.user.id,
          title,
          caption || null,
          location || null,
          people || null,
          filePath,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          mediaType
        ],
        function(err) {
          if (err) {
            // Check if error is due to missing column
            if (err.message && err.message.includes('no such column: media_type')) {
              // Column doesn't exist, add it and retry
              console.log('media_type column missing, adding it now...');
              db.run(`ALTER TABLE photos ADD COLUMN media_type TEXT DEFAULT 'photo'`, (alterErr) => {
                if (alterErr) {
                  console.error('Error adding media_type column:', alterErr);
                  cleanupFiles();
                  return res.status(500).json({ error: 'Database migration failed. Please restart the server.' });
                }
                console.log('Added media_type column, retrying insert...');
                // Retry the insert
                performInsert();
              });
              return;
            }
            
            // Other database errors
            console.error('Database error during media upload:', err);
            console.error('Error details:', err.message);
            console.error('SQL error code:', err.code);
            cleanupFiles();
            return res.status(500).json({ error: err.message || 'Failed to upload media' });
          }

          // Success!
          // Clear cache for photos and search
          clearCache('photos');
          clearCache('search');

          res.status(201).json({
            message: mediaType === 'video' ? 'Video uploaded successfully' : 'Photo uploaded and optimized successfully',
            photo: {
              id: photoId,
              title,
              caption,
              location,
              people,
              file_path: filePath,
              media_type: mediaType,
              created_at: new Date().toISOString()
            }
          });
        }
      );
    };

    // Helper function to cleanup uploaded files on error
    const cleanupFiles = () => {
      if (fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting uploaded file:', unlinkErr);
        }
      }
      if (processedImages) {
        if (processedImages.optimized && fs.existsSync(processedImages.optimized)) {
          try {
            fs.unlinkSync(processedImages.optimized);
          } catch (unlinkErr) {
            console.error('Error deleting optimized file:', unlinkErr);
          }
        }
        if (processedImages.thumbnail && fs.existsSync(processedImages.thumbnail)) {
          try {
            fs.unlinkSync(processedImages.thumbnail);
          } catch (unlinkErr) {
            console.error('Error deleting thumbnail file:', unlinkErr);
          }
        }
      }
    };

    // Try to insert (will auto-retry with migration if column is missing)
    performInsert();
    } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all media (photos/videos) (paginated, with optional category filter)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const category = req.query.category; // 'all', 'photo', or 'video'

  const db = getDatabase();

  // Build WHERE clause for category filter
  let whereClause = '';
  let countWhereClause = '';
  const params = [];
  const countParams = [];

  if (category && category !== 'all' && (category === 'photo' || category === 'video')) {
    whereClause = 'WHERE p.media_type = ?';
    countWhereClause = 'WHERE media_type = ?';
    params.push(category);
    countParams.push(category);
  }

  // Get total count
  db.get(`SELECT COUNT(*) as total FROM photos ${countWhereClause}`, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const total = countResult.total;

    // Add limit and offset to params
    params.push(limit, offset);

    // Get media with creator info
    db.all(
      `SELECT p.*, u.username as creator_username,
       (SELECT AVG(rating) FROM ratings WHERE photo_id = p.id) as avg_rating,
       (SELECT COUNT(*) FROM ratings WHERE photo_id = p.id) as rating_count,
       (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
       FROM photos p
       JOIN users u ON p.creator_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, photos) => {
        if (err) {
          console.error('Error fetching media:', err);
          return res.status(500).json({ error: 'Failed to fetch media' });
        }

        res.json({
          photos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    );
  });
});

// Get single photo by ID
router.get('/:id', (req, res) => {
  const db = getDatabase();

  db.get(
    `SELECT p.*, u.username as creator_username,
     (SELECT AVG(rating) FROM ratings WHERE photo_id = p.id) as avg_rating,
     (SELECT COUNT(*) FROM ratings WHERE photo_id = p.id) as rating_count
     FROM photos p
     JOIN users u ON p.creator_id = u.id
     WHERE p.id = ?`,
    [req.params.id],
    (err, photo) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      res.json({ photo });
    }
  );
});

// Get photos by creator
router.get('/creator/:creatorId', (req, res) => {
  const db = getDatabase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT p.*, u.username as creator_username,
     (SELECT AVG(rating) FROM ratings WHERE photo_id = p.id) as avg_rating,
     (SELECT COUNT(*) FROM ratings WHERE photo_id = p.id) as rating_count
     FROM photos p
     JOIN users u ON p.creator_id = u.id
     WHERE p.creator_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [req.params.creatorId, limit, offset],
    (err, photos) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ photos });
    }
  );
});

// Delete photo (Creator, Admin, or Consumer - own photos only)
router.delete('/:id', authenticateToken, requireCreator, (req, res) => {
  const db = getDatabase();

  // First, get the photo to check ownership and file path
  db.get(
    'SELECT * FROM photos WHERE id = ?',
    [req.params.id],
    (err, photo) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      if (photo.creator_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own photos' });
      }

      // Delete the file
      const filePath = path.join(__dirname, '..', photo.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database (cascade will handle comments and ratings)
      db.run('DELETE FROM photos WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete photo' });
        }

        // Clear cache
        clearCache('photos');
        clearCache('search');

        res.json({ message: 'Photo deleted successfully' });
      });
    }
  );
});

module.exports = router;

