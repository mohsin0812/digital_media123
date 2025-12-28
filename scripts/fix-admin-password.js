const { getDatabase, initDatabase } = require('../database/db');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
    try {
        console.log('🔧 Fixing admin password...');
        await initDatabase();
        
        const db = getDatabase();
        
        // Check if admin exists (by email, username, or role)
        db.get('SELECT * FROM users WHERE email = ? OR username = ? OR role = ?', ['admin@mediashare.com', 'admin', 'admin'], async (err, user) => {
            if (err) {
                console.error('❌ Error checking for admin:', err);
                process.exit(1);
                return;
            }
            
            if (!user) {
                console.log('ℹ️  No admin user found. Creating new admin...');
                // Create new admin
                const { v4: uuidv4 } = require('uuid');
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
                        process.exit(0);
                    }
                );
                return;
            }
            
            // Update existing user to admin role and reset password
            console.log(`ℹ️  Found user: ${user.email || user.username} (role: ${user.role})`);
            console.log('🔄 Updating to admin role and resetting password...');
            
            const newPassword = await bcrypt.hash('admin123', 10);
            
            db.run(
                `UPDATE users 
                 SET role = ?, password_hash = ?, email = ?, username = ?
                 WHERE id = ?`,
                ['admin', newPassword, 'admin@mediashare.com', 'admin', user.id],
                function(err) {
                    if (err) {
                        console.error('❌ Error updating admin:', err);
                        process.exit(1);
                        return;
                    }
                    
                    console.log('✅ Admin password reset successfully!');
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

fixAdminPassword();

