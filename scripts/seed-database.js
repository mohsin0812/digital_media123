const { getDatabase, initDatabase } = require('../database/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Sample images data
const sampleImages = [
    {
        title: 'Mountain Landscape',
        caption: 'Beautiful mountain view at sunset with stunning colors',
        location: 'Swiss Alps, Switzerland',
        people: 'Nature Photographer, Adventure Guide'
    },
    {
        title: 'Ocean Waves',
        caption: 'Peaceful ocean waves crashing on the shore at golden hour',
        location: 'Maldives',
        people: 'Travel Photographer'
    },
    {
        title: 'City Skyline',
        caption: 'Modern city skyline at night with beautiful lights',
        location: 'New York City, USA',
        people: 'Urban Explorer, City Photographer'
    },
    {
        title: 'Forest Path',
        caption: 'Serene forest path through the woods in autumn',
        location: 'Pacific Northwest, USA',
        people: 'Nature Lover, Hiker'
    },
    {
        title: 'Desert Sunset',
        caption: 'Stunning desert landscape during golden hour',
        location: 'Sahara Desert, Morocco',
        people: 'Adventure Seeker, Desert Explorer'
    },
    {
        title: 'Tropical Beach',
        caption: 'Paradise beach with crystal clear turquoise water',
        location: 'Bora Bora, French Polynesia',
        people: 'Beach Enthusiast, Travel Blogger'
    },
    {
        title: 'Aurora Borealis',
        caption: 'Northern lights dancing in the sky over snow-covered landscape',
        location: 'Iceland',
        people: 'Aurora Hunter, Night Photographer'
    },
    {
        title: 'Mountain Lake',
        caption: 'Perfect reflection of mountains in a pristine alpine lake',
        location: 'Canadian Rockies, Canada',
        people: 'Landscape Photographer, Nature Enthusiast'
    },
    {
        title: 'Sunset Over Fields',
        caption: 'Golden hour over rolling fields of wheat',
        location: 'Tuscany, Italy',
        people: 'Travel Photographer, Landscape Artist'
    },
    {
        title: 'Urban Architecture',
        caption: 'Modern architectural masterpiece with geometric patterns',
        location: 'Dubai, UAE',
        people: 'Architecture Photographer, Urban Explorer'
    }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                return downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

function createPlaceholderImage(filepath, title, index) {
    // Create a colorful SVG placeholder
    const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#30cfd0', '#330867'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a9e', '#fecfef'],
        ['#ffecd2', '#fcb69f'],
        ['#ff8a80', '#ea4c89']
    ];
    
    const colorPair = colors[index % colors.length];
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad${index})"/>
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
        fill="white" text-anchor="middle">${title}</text>
  <text x="400" y="320" font-family="Arial, sans-serif" font-size="18" 
        fill="rgba(255,255,255,0.9)" text-anchor="middle">Sample Photo ${index + 1}</text>
  <circle cx="400" cy="200" r="40" fill="rgba(255,255,255,0.3)"/>
  <circle cx="400" cy="200" r="30" fill="rgba(255,255,255,0.5)"/>
  <circle cx="400" cy="200" r="20" fill="rgba(255,255,255,0.7)"/>
</svg>`;
    
    fs.writeFileSync(filepath, svgContent);
}

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        await initDatabase();
        
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            // Create default admin user if no admin exists
            db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'], async (err, adminResult) => {
                if (err) {
                    console.error('❌ Error checking for admin:', err);
                    reject(err);
                    return;
                }
                
                // Function to proceed with creator check and sample photos
                const proceedWithSeeding = () => {
                    // Check if any creator exists (for sample photos)
                    db.get('SELECT id FROM users WHERE role = ? LIMIT 1', ['creator'], async (err, creator) => {
                        if (err) {
                            console.error('❌ Error checking for creators:', err);
                            reject(err);
                            return;
                        }
                        
                        // If no creator exists, skip sample photos
                        if (!creator) {
                            console.log('ℹ️  No creator found. Sample photos will not be created.');
                            console.log('   Login as admin and create a creator account to add sample photos.');
                            console.log('\n📝 Default Admin Credentials:');
                            console.log('   Email: admin@mediashare.com');
                            console.log('   Password: admin123');
                            resolve();
                            return;
                        }
                        
                        const creatorId = creator.id;
                        console.log('✅ Found creator user, proceeding with sample photos...');
                        
                        // Check if photos already exist
                        db.get('SELECT COUNT(*) as count FROM photos', [], async (err, result) => {
                            if (err) {
                                console.error('❌ Error checking photos:', err);
                                reject(err);
                                return;
                            }
                            
                            if (result.count >= sampleImages.length) {
                                console.log(`ℹ️  Database already has ${result.count} photos (enough samples).`);
                                console.log('   To re-seed, delete existing photos first.');
                                resolve();
                                return;
                            }
                            
                            if (result.count > 0) {
                                console.log(`ℹ️  Database has ${result.count} photos. Adding more samples...`);
                            }
                            
                            console.log('📸 Creating sample images...');
                            
                            const uploadsDir = path.join(__dirname, '..', 'uploads');
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            
                            let added = 0;
                            let processed = 0;
                            const total = sampleImages.length;
                            
                            // Function to process a single image
                            function processImage(i) {
                                if (i >= sampleImages.length) {
                                    // All images processed
                                    console.log('\n🎉 Database seeding completed!');
                                    console.log(`\n✨ ${added} sample photos added to the database.`);
                                    console.log('\n📝 Default Admin Credentials:');
                                    console.log('   Email: admin@mediashare.com');
                                    console.log('   Password: admin123');
                                    console.log('   ⚠️  Please change the default password after first login!');
                                    resolve();
                                    return;
                                }
                                
                                const image = sampleImages[i];
                                
                                // Check if photo with this title already exists
                                db.get('SELECT id FROM photos WHERE title = ?', [image.title], (err, existing) => {
                                    if (err) {
                                        console.error(`❌ Error checking photo ${i + 1}:`, err);
                                        processed++;
                                        if (processed === total) {
                                            console.log(`\n✨ ${added} new photos added.`);
                                            resolve();
                                        }
                                        processImage(i + 1);
                                        return;
                                    }
                                    
                                    if (existing) {
                                        console.log(`⏭️  Skipping existing photo: ${image.title}`);
                                        processed++;
                                        if (processed === total) {
                                            console.log(`\n✨ ${added} new photos added. ${total - added} already existed.`);
                                            resolve();
                                        } else {
                                            processImage(i + 1);
                                        }
                                        return;
                                    }
                                    
                                    const photoId = uuidv4();
                                    const filename = `sample-${i + 1}-${Date.now()}.svg`;
                                    const filePath = path.join(uploadsDir, filename);
                                    
                                    // Create placeholder image
                                    createPlaceholderImage(filePath, image.title, i);
                                    
                                    db.run(
                                        `INSERT INTO photos (id, creator_id, title, caption, location, people, file_path, file_name, mime_type, file_size)
                                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [
                                            photoId,
                                            creatorId,
                                            image.title,
                                            image.caption,
                                            image.location,
                                            image.people,
                                            `/uploads/${filename}`,
                                            filename,
                                            'image/svg+xml',
                                            fs.statSync(filePath).size
                                        ],
                                        function(err) {
                                            processed++;
                                            if (err) {
                                                console.error(`❌ Error adding photo ${i + 1}:`, err);
                                            } else {
                                                added++;
                                                console.log(`✅ Added photo ${added}/${total}: ${image.title}`);
                                            }
                                            
                                            processImage(i + 1);
                                        }
                                    );
                                });
                            }
                            
                            // Start processing images
                            processImage(0);
                        });
                    });
                };
                
                // Create default admin if none exists
                    if (adminResult.count === 0) {
                        const adminId = uuidv4();
                        bcrypt.hash('admin123', 10).then(adminPassword => {
                            db.run(
                                `INSERT INTO users (id, username, email, password_hash, role) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [adminId, 'admin', 'admin@mediashare.com', adminPassword, 'admin'],
                                function(err) {
                                    if (err) {
                                        console.error('❌ Error creating admin:', err);
                                        reject(err);
                                        return;
                                    }
                                    console.log('✅ Default admin user created');
                                    console.log('   Email: admin@mediashare.com');
                                    console.log('   Password: admin123');
                                    console.log('   ⚠️  Please change the default password after first login!');
                                    proceedWithSeeding();
                                }
                            );
                        });
                    } else {
                        console.log('ℹ️  Admin user already exists, skipping default admin creation');
                        proceedWithSeeding();
                    }
                });
            });
        });
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run the seed
seedDatabase()
    .then(() => {
        console.log('\n✅ Seeding completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    });
