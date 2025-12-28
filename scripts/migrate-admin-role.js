const { getDatabase, initDatabase } = require('../database/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrateAdminRole() {
    try {
        console.log('🔄 Migrating database to support admin role...');
        await initDatabase();
        
        const db = getDatabase();
        
        // SQLite doesn't support modifying CHECK constraints directly
        // We need to recreate the users table with the new constraint
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Step 1: Create a new table with the updated schema
                console.log('📋 Creating new users table with admin role support...');
                db.run(`
                    CREATE TABLE IF NOT EXISTS users_new (
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
                        console.error('❌ Error creating new users table:', err);
                        reject(err);
                        return;
                    }
                    
                    // Step 2: Copy data from old table to new table
                    console.log('📦 Copying existing users to new table...');
                    db.run(`
                        INSERT INTO users_new (id, username, email, password_hash, role, created_at, updated_at)
                        SELECT id, username, email, password_hash, role, created_at, updated_at
                        FROM users
                    `, (err) => {
                        if (err) {
                            console.error('❌ Error copying users:', err);
                            reject(err);
                            return;
                        }
                        
                        // Step 3: Drop old table
                        console.log('🗑️  Dropping old users table...');
                        db.run('DROP TABLE users', (err) => {
                            if (err) {
                                console.error('❌ Error dropping old table:', err);
                                reject(err);
                                return;
                            }
                            
                            // Step 4: Rename new table to users
                            console.log('✏️  Renaming new table...');
                            db.run('ALTER TABLE users_new RENAME TO users', (err) => {
                                if (err) {
                                    console.error('❌ Error renaming table:', err);
                                    reject(err);
                                    return;
                                }
                                
                                // Step 5: Recreate indexes
                                console.log('🔍 Recreating indexes...');
                                db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', () => {});
                                db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)', () => {});
                                
                                console.log('✅ Migration completed successfully!');
                                console.log('   Database now supports admin, creator, and consumer roles.');
                                resolve();
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    }
}

migrateAdminRole()
    .then(() => {
        console.log('\n✅ Migration completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });

