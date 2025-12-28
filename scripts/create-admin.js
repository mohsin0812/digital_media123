const { getDatabase, initDatabase } = require('../database/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
    try {
        console.log('🔧 Creating admin user...');
        await initDatabase();
        
        const db = getDatabase();
        
        // Check if admin already exists
        db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'], async (err, result) => {
            if (err) {
                console.error('❌ Error checking for admin:', err);
                process.exit(1);
                return;
            }
            
            if (result.count > 0) {
                console.log('ℹ️  Admin user already exists!');
                console.log('   Email: admin@mediashare.com');
                console.log('   Password: admin123');
                process.exit(0);
                return;
            }
            
            // Create admin user
            const adminId = uuidv4();
            const adminPassword = await bcrypt.hash('admin123', 10);
            
            db.run(
                `INSERT INTO users (id, username, email, password_hash, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                [adminId, 'admin', 'admin@mediashare.com', adminPassword, 'admin'],
                function(err) {
                    if (err) {
                        console.error('❌ Error creating admin:', err);
                        process.exit(1);
                        return;
                    }
                    
                    console.log('✅ Admin user created successfully!');
                    console.log('\n📝 Login Credentials:');
                    console.log('   Email: admin@mediashare.com');
                    console.log('   Password: admin123');
                    console.log('   ⚠️  Please change the default password after first login!');
                    process.exit(0);
                }
            );
        });
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();

