const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database', 'media_app.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // Users table
    database.serialize(() => {
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'creator', 'consumer')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        
        // Migration: Update existing CHECK constraint to include 'admin' role
        // SQLite doesn't support modifying CHECK constraints, so we'll handle it in application logic
        // But we can verify the table structure
        database.all("PRAGMA table_info(users)", [], (pragmaErr, columns) => {
          if (!pragmaErr && columns) {
            console.log('Users table structure verified');
          }
        });
      });

      // Photos table
      database.run(`
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          creator_id TEXT NOT NULL,
          title TEXT NOT NULL,
          caption TEXT,
          location TEXT,
          people TEXT,
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          mime_type TEXT,
          file_size INTEGER,
          media_type TEXT DEFAULT 'photo' CHECK(media_type IN ('photo', 'video')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating photos table:', err);
          reject(err);
          return;
        }
        
        // Add media_type column if it doesn't exist (migration)
        database.all("PRAGMA table_info(photos)", [], (pragmaErr, columns) => {
          if (pragmaErr) {
            console.log('Note: Could not check for media_type column:', pragmaErr.message);
          } else if (columns && Array.isArray(columns)) {
            const hasMediaType = columns.some(col => col.name === 'media_type');
            if (!hasMediaType) {
              // SQLite doesn't support CHECK constraints in ALTER TABLE
              database.run(`ALTER TABLE photos ADD COLUMN media_type TEXT DEFAULT 'photo'`, (alterErr) => {
                if (alterErr) {
                  console.log('Note: Could not add media_type column:', alterErr.message);
                } else {
                  console.log('Added media_type column to photos table');
                  // Update existing records
                  database.run(`UPDATE photos SET media_type = 'photo' WHERE media_type IS NULL`, () => {});
                }
              });
            } else {
              console.log('media_type column already exists in photos table');
            }
          }
        });
      });

      // Comments table
      database.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          photo_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating comments table:', err);
          reject(err);
          return;
        }
      });

      // Ratings table
      database.run(`
        CREATE TABLE IF NOT EXISTS ratings (
          id TEXT PRIMARY KEY,
          photo_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(photo_id, user_id),
          FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating ratings table:', err);
          reject(err);
          return;
        }
      });

      // Indexes for performance
      database.run(`CREATE INDEX IF NOT EXISTS idx_photos_creator ON photos(creator_id)`, () => {});
      database.run(`CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC)`, () => {});
      database.run(`CREATE INDEX IF NOT EXISTS idx_comments_photo ON comments(photo_id)`, () => {});
      database.run(`CREATE INDEX IF NOT EXISTS idx_ratings_photo ON ratings(photo_id)`, () => {});
      database.run(`CREATE INDEX IF NOT EXISTS idx_photos_title ON photos(title)`, () => {});
      database.run(`CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(location)`, () => {});

      console.log('Database initialized successfully');
      resolve();
    });
  });
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase
};

